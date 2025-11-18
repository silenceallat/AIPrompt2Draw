/**
 * AIPrompt2Draw 主应用入口
 * 协调所有模块，启动SPA应用
 */

class App {
    constructor() {
        this.isInitialized = false;
        this.eventTarget = new EventTarget();
        this.modules = new Map();

        // 绑定方法
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.handleOnlineStatusChange = this.handleOnlineStatusChange.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            this.logInfo('应用初始化开始');

            // 检查浏览器兼容性
            this.checkBrowserCompatibility();

            // 设置全局错误处理
            this.setupGlobalErrorHandling();

            // 初始化主题
            this.initTheme();

            // 加载配置
            this.loadConfiguration();

            // 初始化模块
            await this.initializeModules();

            // 设置事件监听器
            this.setupEventListeners();

            // 启动路由
            await this.startRouting();

            // 标记为已初始化
            this.isInitialized = true;

            // 触发就绪事件
            this.emitEvent(AppEvents.APP_READY);

            this.logInfo('应用初始化完成');

        } catch (error) {
            this.logError('应用初始化失败', error);
            this.emitEvent(AppEvents.APP_ERROR, { error, phase: 'initialization' });
            throw error;
        }
    }

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'Promise',
            'fetch',
            'localStorage',
            'sessionStorage',
            'CustomEvent',
            'Map',
            'Set',
            'Arrow functions',
            'Template literals'
        ];

        const missingFeatures = [];

        // 检查ES6+特性
        try {
            // 箭头函数检查
            const arrowTest = () => {};
            arrowTest();
        } catch (e) {
            missingFeatures.push('Arrow functions');
        }

        try {
            // 模板字符串检查
            const templateTest = `test ${1}`;
            if (templateTest !== 'test 1') {
                missingFeatures.push('Template literals');
            }
        } catch (e) {
            missingFeatures.push('Template literals');
        }

        // 检查其他必需特性
        if (typeof Promise === 'undefined') missingFeatures.push('Promise');
        if (typeof fetch === 'undefined') missingFeatures.push('fetch');
        if (typeof localStorage === 'undefined') missingFeatures.push('localStorage');
        if (typeof sessionStorage === 'undefined') missingFeatures.push('sessionStorage');
        if (typeof CustomEvent === 'undefined') missingFeatures.push('CustomEvent');
        if (typeof Map === 'undefined') missingFeatures.push('Map');
        if (typeof Set === 'undefined') missingFeatures.push('Set');

        if (missingFeatures.length > 0) {
            this.showCompatibilityError(missingFeatures);
            throw new Error(`浏览器不兼容，缺少: ${missingFeatures.join(', ')}`);
        }
    }

    /**
     * 显示兼容性错误
     */
    showCompatibilityError(missingFeatures) {
        const errorMessage = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #1a1a1a;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="font-size: 24px; margin-bottom: 20px;">浏览器兼容性错误</h1>
                    <p style="margin-bottom: 20px;">您的浏览器不支持以下必需特性：</p>
                    <ul style="list-style: none; padding: 0; margin-bottom: 20px;">
                        ${missingFeatures.map(feature => `<li style="margin: 5px 0;">• ${feature}</li>`).join('')}
                    </ul>
                    <p>请升级到现代浏览器以使用本应用。</p>
                </div>
            </div>
        `;
        document.documentElement.innerHTML = errorMessage;
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // JavaScript错误
        window.addEventListener('error', (event) => {
            this.logError('JavaScript错误', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Promise rejection错误
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('未处理的Promise拒绝', {
                reason: event.reason
            });
            event.preventDefault(); // 防止控制台输出错误
        });

        // 资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError('资源加载错误', {
                    target: event.target.tagName,
                    src: event.target.src || event.target.href
                });
            }
        }, true);
    }

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = localStorage.getItem(StorageKeys.THEME) || AppConfig.DEFAULTS.THEME;
        this.setTheme(savedTheme);
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        if (!Object.values(AppConfig.THEMES).includes(theme)) {
            theme = AppConfig.DEFAULTS.THEME;
        }

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(StorageKeys.THEME, theme);

        this.emitEvent(AppEvents.THEME_CHANGED, { theme });
        this.logInfo('主题已设置', { theme });
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === AppConfig.THEMES.DARK
            ? AppConfig.THEMES.LIGHT
            : AppConfig.THEMES.DARK;
        this.setTheme(newTheme);
        return newTheme;
    }

    /**
     * 加载配置
     */
    loadConfiguration() {
        try {
            // 加载用户设置
            const settings = this.loadUserSettings();
            this.applySettings(settings);

            this.logInfo('配置加载完成', { settings });
        } catch (error) {
            this.logError('配置加载失败', error);
            // 使用默认配置
            this.applySettings(DefaultSettings);
        }
    }

    /**
     * 加载用户设置
     */
    loadUserSettings() {
        const settingsStr = localStorage.getItem(StorageKeys.SETTINGS);
        return settingsStr ? JSON.parse(settingsStr) : { ...DefaultSettings };
    }

    /**
     * 应用设置
     */
    applySettings(settings) {
        // 应用主题设置
        if (settings.theme) {
            this.setTheme(settings.theme);
        }

        // 应用语言设置
        if (settings.language) {
            document.documentElement.lang = settings.language;
        }

        // 应用其他设置
        this.settings = { ...DefaultSettings, ...settings };
    }

    /**
     * 保存用户设置
     */
    saveUserSettings(settings) {
        const mergedSettings = { ...this.settings, ...settings };
        localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(mergedSettings));
        this.settings = mergedSettings;
        this.emitEvent(AppEvents.USER_SETTINGS_CHANGED, mergedSettings);
    }

    /**
     * 初始化模块
     */
    async initializeModules() {
        try {
            // 按依赖顺序初始化模块

            // 1. 认证管理器
            if (window.authManager) {
                await this.initializeModule('auth', window.authManager);
            } else {
                throw new Error('认证管理器未加载');
            }

            // 2. 路由管理器
            if (window.router) {
                await this.initializeModule('router', window.router);
            } else {
                throw new Error('路由管理器未加载');
            }

            // 3. 组件管理器
            if (window.componentManager) {
                await this.initializeModule('component', window.componentManager);
            }

            this.logInfo('模块加载完成');

        } catch (error) {
            this.logError('模块初始化失败', error);
            throw error;
        }
    }

    /**
     * 初始化单个模块
     */
    async initializeModule(name, module) {
        try {
            if (typeof module.init === 'function') {
                await module.init();
            }

            this.modules.set(name, module);
            this.logInfo(`模块 ${name} 初始化完成`, { module });

        } catch (error) {
            this.logError(`模块 ${name} 初始化失败`, error);
            throw error;
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // DOM事件
        document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // 网络状态监控
        this.setupNetworkMonitoring();

        // 认证事件监听
        if (window.authManager) {
            window.authManager.addEventListener(AppEvents.AUTH_LOGIN, (event) => {
                this.logInfo('用户登录', { user: event.detail });
            });

            window.authManager.addEventListener(AppEvents.AUTH_LOGOUT, (event) => {
                this.logInfo('用户登出', { user: event.detail });
            });

            window.authManager.addEventListener(AppEvents.AUTH_TOKEN_EXPIRED, () => {
                this.logInfo('Token已过期');
                this.showNotification('登录已过期，请重新登录', 'warning');
            });
        }

        // 路由事件监听
        if (window.router) {
            window.router.addEventListener(AppEvents.ROUTE_CHANGE, (event) => {
                const { from, to } = event.detail;
                this.logInfo('路由变更', { from: from?.path, to: to?.path });
            });
        }
    }

    /**
     * 设置网络监控
     */
    setupNetworkMonitoring() {
        // 监控网络请求
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();

            try {
                this.emitEvent(AppEvents.NETWORK_REQUEST_START, { url: args[0] });

                const response = await originalFetch(...args);
                const duration = Date.now() - startTime;

                this.emitEvent(AppEvents.NETWORK_REQUEST_SUCCESS, {
                    url: args[0],
                    status: response.status,
                    duration
                });

                return response;
            } catch (error) {
                const duration = Date.now() - startTime;

                this.emitEvent(AppEvents.NETWORK_REQUEST_ERROR, {
                    url: args[0],
                    error,
                    duration
                });

                throw error;
            }
        };
    }

    /**
     * 启动路由
     */
    async startRouting() {
        try {
            // 获取初始路由
            const initialPath = this.getInitialRoute();

            // 导航到初始路由
            await window.router.navigate(initialPath);

            this.logInfo('路由系统已启动', { initialPath });

        } catch (error) {
            this.logError('路由启动失败', error);
            throw error;
        }
    }

    /**
     * 获取初始路由
     */
    getInitialRoute() {
        const router = window.router;
        const rawHash = window.location.hash;
        const hashPath = router
            ? router.normalizePath(rawHash)
            : rawHash.replace(/^#\/?/, '');

        if (hashPath) {
            return hashPath;
        }

        // 根据认证状态决定默认路由
        if (window.authManager && window.authManager.isLoggedIn()) {
            return window.authManager.isAdmin()
                ? AppConfig.ROUTES.ADMIN
                : AppConfig.ROUTES.MAIN;
        }

        return AppConfig.ROUTES.LOGIN;
    }

    /**
     * DOM内容加载完成处理
     */
    async handleDOMContentLoaded() {
        try {
            // 隐藏加载指示器
            this.hideLoadingIndicator();

            // 检查认证状态
            await this.checkAuthentication();

            this.logInfo('DOM内容加载完成');

        } catch (error) {
            this.logError('DOM加载处理失败', error);
        }
    }

    /**
     * 页面卸载前处理
     */
    handleBeforeUnload() {
        // 保存应用状态
        this.saveApplicationState();

        // 清理资源
        this.cleanup();
    }

    /**
     * 网络状态变化处理
     */
    handleOnlineStatusChange() {
        const isOnline = navigator.onLine;
        this.emitEvent('network:statusChanged', { isOnline });

        if (isOnline) {
            this.showNotification('网络已连接', 'success');
        } else {
            this.showNotification('网络已断开', 'warning');
        }
    }

    /**
     * 页面可见性变化处理
     */
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        this.emitEvent('app:visibilityChanged', { isVisible });

        if (isVisible && this.isInitialized) {
            // 页面重新可见时检查认证状态
            this.checkAuthentication();
        }
    }

    /**
     * 错误处理
     */
    handleError(error) {
        this.logError('应用错误', error);
        this.emitEvent(AppEvents.APP_ERROR, { error });

        // 显示用户友好的错误信息
        this.showNotification('发生错误，请稍后重试', 'error');
    }

    /**
     * 检查认证状态
     */
    async checkAuthentication() {
        try {
            if (window.authManager && window.authManager.isLoggedIn()) {
                const isValid = await window.authManager.verifyToken();
                if (!isValid) {
                    this.logInfo('Token验证失败，跳转登录页');
                    await window.router.navigate(AppConfig.ROUTES.LOGIN);
                }
            }
        } catch (error) {
            this.logError('认证状态检查失败', error);
        }
    }

    /**
     * 隐藏加载指示器
     */
    hideLoadingIndicator() {
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 这里可以实现一个通知系统
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * 保存应用状态
     */
    saveApplicationState() {
        try {
            // 保存当前路由
            if (window.router && window.router.getCurrentPath()) {
                sessionStorage.setItem('lastRoute', window.router.getCurrentPath());
            }

            // 保存其他必要的状态
            // ...

        } catch (error) {
            this.logError('应用状态保存失败', error);
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        try {
            // 清理模块
            this.modules.forEach((module, name) => {
                if (typeof module.destroy === 'function') {
                    module.destroy();
                }
            });

            // 清理事件监听器
            document.removeEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            window.removeEventListener('online', this.handleOnlineStatusChange);
            window.removeEventListener('offline', this.handleOnlineStatusChange);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);

            this.logInfo('资源清理完成');

        } catch (error) {
            this.logError('资源清理失败', error);
        }
    }

    /**
     * 获取应用状态
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            modules: Array.from(this.modules.keys()),
            settings: this.settings,
            theme: document.documentElement.getAttribute('data-theme'),
            isOnline: navigator.onLine,
            isVisible: !document.hidden
        };
    }

    /**
     * 触发事件
     */
    emitEvent(eventType, detail = {}) {
        const event = new CustomEvent(eventType, {
            detail: { app: this, ...detail }
        });
        this.eventTarget.dispatchEvent(event);
    }

    /**
     * 添加事件监听器
     */
    addEventListener(eventType, listener) {
        this.eventTarget.addEventListener(eventType, listener);
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(eventType, listener) {
        this.eventTarget.removeEventListener(eventType, listener);
    }

    /**
     * 记录调试日志
     */
    logDebug(message, data) {
        if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.CONSOLE_LOGS) {
            console.log(`🎯 [App] ${message}`, data);
        }
    }

    /**
     * 记录信息日志
     */
    logInfo(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.info(`🎯 [App] ${message}`, data);
        }
    }

    /**
     * 记录警告日志
     */
    logWarning(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.warn(`⚠️ [App] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     */
    logError(message, error) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.error(`❌ [App] ${message}`, error);
        }
    }
}

// 创建全局应用实例
window.app = new App();

// 应用启动函数
async function startApp() {
    try {
        await window.app.init();
    } catch (error) {
        console.error('应用启动失败:', error);

        // 显示启动错误页面
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f9fafb;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="color: #ef4444; margin-bottom: 20px;">应用启动失败</h1>
                    <p style="color: #6b7280; margin-bottom: 20px;">很抱歉，应用启动时遇到了问题。</p>
                    <p style="color: #9ca3af; font-size: 14px;">请刷新页面重试，或联系技术支持。</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                    ">刷新页面</button>
                </div>
            </div>
        `;
    }
}

// 导出应用类和启动函数
window.App = App;
window.startApp = startApp;

// 导出（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, startApp };
}
