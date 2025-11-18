/**
 * 认证管理模块
 * 负责用户登录、登出、token验证和权限控制
 */

class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.tokenExpiry = null;
        this.refreshTimer = null;
        this.eventTarget = new EventTarget();

        // 防重复跳转机制
        this.isRedirecting = false;
        this.lastRedirectTime = 0;
        this.redirectCooldown = 2000; // 2秒冷却时间

        // 绑定方法到实例
        this.handleTokenExpired = this.handleTokenExpired.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

        // 初始化
        this.init();
    }

    /**
     * 初始化认证管理器
     */
    init() {
        this.loadStoredAuth();
        this.setupEventListeners();

        if (AppConfig.DEBUG.ENABLED) {
            console.log('认证管理器已初始化');
        }
    }

    /**
     * 从本地存储加载认证信息
     */
    loadStoredAuth() {
        try {
            this.token = localStorage.getItem(StorageKeys.TOKEN);
            this.user = JSON.parse(localStorage.getItem(StorageKeys.USER) || 'null');
            this.tokenExpiry = parseInt(localStorage.getItem(StorageKeys.TOKEN_EXPIRY) || '0');

            if (this.token && this.user) {
                this.startTokenRefreshTimer();
                this.logDebug('已从本地存储加载认证信息', { user: this.user.username });
            }
        } catch (error) {
            this.logError('加载认证信息失败', error);
            this.clearAuth();
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 页面可见性变化时检查Token状态
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // 页面即将卸载时清理资源
        window.addEventListener('beforeunload', () => {
            this.stopTokenRefreshTimer();
        });
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<boolean>} 登录是否成功
     */
    async login(username, password) {
        try {
            this.logDebug('开始用户登录', { username });

            // 确保API客户端已初始化
            if (!window.apiClient) {
                this.logError('API客户端未初始化');
                return false;
            }

            const result = await window.apiClient.post(ApiEndpoints.AUTH.LOGIN, {
                username,
                password
            }, {
                requireAuth: false // 登录接口不需要认证
            });

            if (result.success) {
                const userData = result.data;

                // 保存认证信息
                this.token = userData.token;
                this.user = {
                    username: userData.username,
                    nickname: userData.nickname || userData.username,
                    role: userData.role || AppConfig.USER_ROLES.USER
                };
                this.tokenExpiry = Date.now() + AppConfig.AUTH.TOKEN_EXPIRY_TIME;

                // 持久化存储
                this.saveAuth();

                // 启动token刷新定时器
                this.startTokenRefreshTimer();

                // 触发登录成功事件
                this.emitEvent(AppEvents.AUTH_LOGIN, this.user);

                this.logInfo('用户登录成功', { user: this.user.username, role: this.user.role });
                return true;
            } else {
                this.logError('登录失败', result.message);
                return false;
            }
        } catch (error) {
            this.logError('登录异常', error);
            return false;
        }
    }

    /**
     * 用户登出
     * @returns {Promise<boolean>} 登出是否成功
     */
    async logout() {
        try {
            this.logDebug('开始用户登出');

            // 通知后端登出
            if (this.token && window.apiClient) {
                try {
                    await window.apiClient.post(ApiEndpoints.AUTH.LOGOUT, {}, {
                        requireAuth: true
                    });
                } catch (error) {
                    this.logError('后端登出失败', error);
                }
            }

            // 清理本地认证信息
            const user = this.user;
            this.clearAuth();

            // 触发登出事件
            this.emitEvent(AppEvents.AUTH_LOGOUT, user);

            this.logInfo('用户已登出', { user: user?.username });
            return true;
        } catch (error) {
            this.logError('用户登出异常', error);
            return false;
        }
    }

    /**
     * 验证当前token是否有效
     * @returns {Promise<boolean>} token是否有效
     */
    async verifyToken() {
        try {
            if (!this.token) {
                return false;
            }

            // 检查token是否过期
            if (this.isTokenExpired()) {
                this.logDebug('Token已过期，处理登出');
                return false;
            }

            if (!window.apiClient) {
                this.logError('API客户端未初始化');
                return false;
            }

            const result = await window.apiClient.get(ApiEndpoints.AUTH.VERIFY, {
                requireAuth: true
            });

            if (result.success) {
                // 更新用户信息
                const userData = result.data;
                this.user = {
                    username: userData.username,
                    nickname: userData.nickname || userData.username,
                    role: userData.role || AppConfig.USER_ROLES.USER
                };
                this.saveAuth();

                return true;
            } else {
                this.logError('Token验证失败', result.message);
                return false;
            }
        } catch (error) {
            this.logError('Token验证异常', error);
            return false;
        }
    }

    /**
     * 刷新token
     * @returns {Promise<boolean>} 刷新是否成功
     */
    async refreshToken() {
        try {
            if (!this.token) {
                return false;
            }

            this.logDebug('开始刷新token');

            if (!window.apiClient) {
                this.logError('API客户端未初始化');
                return false;
            }

            const result = await window.apiClient.post(ApiEndpoints.AUTH.REFRESH, {}, {
                requireAuth: true
            });

            if (result.success && result.data.token) {
                this.token = result.data.token;
                this.tokenExpiry = Date.now() + AppConfig.AUTH.TOKEN_EXPIRY_TIME;
                this.saveAuth();
                this.startTokenRefreshTimer();

                this.emitEvent(AppEvents.AUTH_TOKEN_REFRESHED, this.user);
                this.logDebug('Token刷新成功');
                return true;
            } else {
                this.logError('Token刷新失败', result.message);
                return false;
            }
        } catch (error) {
            this.logError('Token刷新异常', error);
            return false;
        }
    }

    /**
     * 检查用户是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return !!(this.token && this.user);
    }

    /**
     * 检查用户是否为管理员
     * @returns {boolean} 是否为管理员
     */
    isAdmin() {
        return this.user?.role === AppConfig.USER_ROLES.ADMIN;
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        return this.user ? { ...this.user } : null;
    }

    /**
     * 获取当前token
     * @returns {string|null} JWT token
     */
    getToken() {
        return this.token;
    }

    /**
     * 检查token是否过期
     * @returns {boolean} 是否过期
     */
    isTokenExpired() {
        if (!this.tokenExpiry) {
            return false;
        }
        return Date.now() >= this.tokenExpiry;
    }

    /**
     * 获取认证头
     * @returns {Object} 包含Authorization的headers
     */
    getAuthHeaders() {
        // 确保从本地存储重新加载token
        if (!this.token) {
            this.loadStoredAuth();
        }

        const token = this.getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        return {
            'Authorization': AppConfig.AUTH.BEARER_PREFIX + token,
            'Content-Type': 'application/json'
        };
    }

    /**
     * 保存认证信息到本地存储
     */
    saveAuth() {
        try {
            localStorage.setItem(StorageKeys.TOKEN, this.token);
            localStorage.setItem(StorageKeys.USER, JSON.stringify(this.user));
            localStorage.setItem(StorageKeys.TOKEN_EXPIRY, this.tokenExpiry.toString());
        } catch (error) {
            this.logError('保存认证信息失败', error);
        }
    }

    /**
     * 清理认证信息
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        this.tokenExpiry = null;
        this.stopTokenRefreshTimer();

        // 清理本地存储
        localStorage.removeItem(StorageKeys.TOKEN);
        localStorage.removeItem(StorageKeys.USER);
        localStorage.removeItem(StorageKeys.TOKEN_EXPIRY);
    }

    /**
     * 启动token刷新定时器
     */
    startTokenRefreshTimer() {
        if (!AppConfig.AUTH.AUTO_REFRESH || !this.tokenExpiry) {
            return;
        }

        this.stopTokenRefreshTimer();

        const refreshTime = this.tokenExpiry - AppConfig.AUTH.REFRESH_THRESHOLD;
        const delay = Math.max(0, refreshTime - Date.now());

        this.logDebug('设置token刷新定时器', {
            delay: Math.round(delay / 1000) + '秒',
            expiry: new Date(this.tokenExpiry).toLocaleString()
        });

        this.refreshTimer = setTimeout(async () => {
            const success = await this.refreshToken();
            if (!success) {
                this.handleTokenExpired();
            }
        }, delay);
    }

    /**
     * 停止token刷新定时器
     */
    stopTokenRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * 处理token过期
     */
    handleTokenExpired() {
        this.logDebug('Token已过期，处理登出');
        this.emitEvent(AppEvents.AUTH_TOKEN_EXPIRED, this.user);
        this.clearAuth();

        // 优先交给路由处理重定向，若路由不存在再降级
        if (!window.router) {
            this.redirectToLogin();
        }
    }

    /**
     * 重定向到登录页面
     */
    redirectToLogin() {
        // 防重复跳转检查
        const currentTime = Date.now();
        if (this.isRedirecting || (currentTime - this.lastRedirectTime) < this.redirectCooldown) {
            this.logDebug('跳转冷却中，忽略重定向请求');
            return;
        }

        // 检查当前是否已经在登录页面
        const currentPath = window.location.pathname;
        const normalizedHash = window.location.hash.replace(/^#\/?/, '');

        // 如果已经在登录页面，不需要跳转
        if (normalizedHash === AppConfig.ROUTES.LOGIN || currentPath.includes('login')) {
            this.logDebug('已经在登录页面，无需跳转');
        }

        this.logDebug('重定向到登录页面');
        this.isRedirecting = true;
        this.lastRedirectTime = currentTime;

        try {
            if (currentPath === '/' || currentPath === '/index.html') {
                // 如果已经在主页面，只需要切换到登录状态
                if (window.router && !window.router.isNavigating) {
                    window.router.navigate(AppConfig.ROUTES.LOGIN, { replaceState: true });
                } else {
                    // 降级处理：直接修改hash
                    window.location.hash = `#${AppConfig.ROUTES.LOGIN}`;
                }
            } else {
                // 如果在其他页面，直接跳转到根路径（会自动加载登录组件）
                window.location.href = `/#${AppConfig.ROUTES.LOGIN}`;
            }
        } catch (error) {
            this.logError('重定向失败', error);
            // 降级处理
            window.location.href = `/#${AppConfig.ROUTES.LOGIN}`;
        } finally {
            // 重置跳转状态
            setTimeout(() => {
                this.isRedirecting = false;
            }, 1000);
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (!document.hidden && this.isLoggedIn()) {
            // 页面重新可见时检查Token状态
            this.verifyToken().catch(error => {
                this.logError('页面可见性检查失败', error);
                this.handleTokenExpired();
            });
        }
    }

    /**
     * 添加事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} listener - 监听器函数
     */
    addEventListener(eventType, listener) {
        this.eventTarget.addEventListener(eventType, listener);
    }

    /**
     * 移除事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} listener - 监听器函数
     */
    removeEventListener(eventType, listener) {
        this.eventTarget.removeEventListener(eventType, listener);
    }

    /**
     * 触发自定义事件
     * @param {string} eventType - 事件类型
     * @param {Object} detail - 事件详情
     */
    emitEvent(eventType, detail) {
        const event = new CustomEvent(eventType, { detail });
        this.eventTarget.dispatchEvent(event);
    }

    /**
     * 记录调试日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logDebug(message, data) {
        if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.CONSOLE_LOGS) {
            console.log(`🔐 [Auth] ${message}`, data);
        }
    }

    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logInfo(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.info(`🔐 [Auth] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.error(`🔐 [Auth] ${message}`, error);
        }
    }
}

// 创建全局认证管理器实例
window.authManager = new AuthManager();
window.AuthManager = AuthManager; // 兼容异步脚本检查

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}