/**
 * 路由管理模块
 * 负责单页应用的路由控制、页面切换和权限验证
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.previousRoute = null;
        this.eventTarget = new EventTarget();
        this.isNavigating = false;

        // 路由历史
        this.history = [];
        this.maxHistorySize = 50;

        // 绑定方法
        this.handlePopState = this.handlePopState.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);

        // 初始化
        this.init();
    }

    /**
     * 初始化路由管理器
     */
    init() {
        this.setupEventListeners();
        this.registerDefaultRoutes();

        if (AppConfig.DEBUG.ENABLED) {
            console.log('🛣️ 路由管理器已初始化');
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 浏览器前进后退事件
        window.addEventListener('popstate', this.handlePopState);

        // 拦截所有链接点击
        document.addEventListener('click', this.handleLinkClick);

        // 监听认证事件
        const authManager = window.authManager || window.AuthManager;
        if (authManager) {
            authManager.addEventListener(AppEvents.AUTH_LOGIN, () => {
                this.redirectToDefaultRoute();
            });

            authManager.addEventListener(AppEvents.AUTH_LOGOUT, () => {
                this.redirectToLogin();
            });

            authManager.addEventListener(AppEvents.AUTH_TOKEN_EXPIRED, () => {
                this.redirectToLogin();
            });
        }
    }

    /**
     * 注册默认路由
     */
    registerDefaultRoutes() {
        // 注册路由
        this.register(AppConfig.ROUTES.LOGIN, {
            component: 'login',
            title: '登录',
            requireAuth: false,
            adminOnly: false
        });

        this.register(AppConfig.ROUTES.MAIN, {
            component: 'main',
            title: '一语成图',
            requireAuth: true,
            adminOnly: false
        });

        this.register(AppConfig.ROUTES.PROFILE, {
            component: 'profile',
            title: '个人中心',
            requireAuth: true,
            adminOnly: false
        });

        this.register(AppConfig.ROUTES.ADMIN, {
            component: 'admin',
            title: '管理后台',
            requireAuth: true,
            adminOnly: true
        });
    }

    /**
     * 注册路由
     * @param {string} path - 路由路径
     * @param {Object} config - 路由配置
     */
    register(path, config) {
        this.routes.set(path, {
            path,
            component: config.component,
            title: config.title,
            requireAuth: config.requireAuth || false,
            adminOnly: config.adminOnly || false,
            meta: config.meta || {},
            beforeEnter: config.beforeEnter,
            afterEnter: config.afterEnter
        });
    }

    /**
     * 导航到指定路由
     * @param {string} path - 目标路径
     * @param {Object} options - 导航选项
     * @returns {Promise<boolean>} 导航是否成功
     */
    async navigate(path, options = {}) {
        if (this.isNavigating) {
            this.logDebug('正在导航中，忽略导航请求', { path });
            return false;
        }

        try {
            this.isNavigating = true;

            // 触发路由变更前事件
            const beforeEvent = new CustomEvent(AppEvents.ROUTE_BEFORE_CHANGE, {
                detail: { from: this.currentRoute, to: path, options }
            });
            this.eventTarget.dispatchEvent(beforeEvent);

            if (beforeEvent.defaultPrevented) {
                this.logDebug('路由变更被阻止', { path });
                return false;
            }

            // 检查路由是否存在
            if (!this.routes.has(path)) {
                this.logError('路由不存在', { path });
                await this.navigate(AppConfig.ROUTES.MAIN);
                return false;
            }

            const routeConfig = this.routes.get(path);

            // 执行路由前置守卫
            if (routeConfig.beforeEnter) {
                const canEnter = await routeConfig.beforeEnter(routeConfig, this.currentRoute);
                if (!canEnter) {
                    this.logDebug('路由前置守卫阻止进入', { path });
                    return false;
                }
            }

            // 权限验证
            if (!await this.checkRoutePermission(routeConfig)) {
                this.logDebug('权限验证失败', { path });
                return false;
            }

            // 执行路由切换
            await this.performRouteChange(routeConfig, options);

            // 执行路由后置守卫
            if (routeConfig.afterEnter) {
                await routeConfig.afterEnter(routeConfig, this.previousRoute);
            }

            // 更新历史记录
            this.updateHistory(routeConfig);

            // 触发路由变更后事件
            const afterEvent = new CustomEvent(AppEvents.ROUTE_CHANGE, {
                detail: { from: this.previousRoute, to: routeConfig }
            });
            this.eventTarget.dispatchEvent(afterEvent);

            this.logInfo('路由导航成功', { path, title: routeConfig.title });
            return true;

        } catch (error) {
            this.logError('路由导航失败', error);
            return false;
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * 检查路由权限
     * @param {Object} routeConfig - 路由配置
     * @returns {Promise<boolean>} 是否有权限
     */
    async checkRoutePermission(routeConfig) {
        // 检查是否需要认证
        const authManager = window.authManager || window.AuthManager;
        if (routeConfig.requireAuth && !authManager.isLoggedIn()) {
            await this.redirectToLogin();
            return false;
        }

        // 检查是否需要管理员权限
        if (routeConfig.adminOnly && !authManager.isAdmin()) {
            this.logDebug('需要管理员权限', { path: routeConfig.path });
            if (authManager.isLoggedIn()) {
                await this.navigate(AppConfig.ROUTES.MAIN);
            } else {
                await this.redirectToLogin();
            }
            return false;
        }

        return true;
    }

    /**
     * 执行路由切换
     * @param {Object} routeConfig - 路由配置
     * @param {Object} options - 导航选项
     */
    async performRouteChange(routeConfig, options) {
        this.previousRoute = this.currentRoute;
        this.currentRoute = routeConfig;

        // 更新页面标题
        document.title = routeConfig.title;

        // 更新浏览器历史
        if (!options.replaceState) {
            const state = { path: routeConfig.path };
            window.history.pushState(state, routeConfig.title, `#${routeConfig.path}`);
        }

        // 加载组件
        await this.loadComponent(routeConfig.component);

        // 更新浏览器URL
        if (routeConfig.path !== AppConfig.ROUTES.LOGIN) {
            window.history.replaceState(
                { path: routeConfig.path },
                routeConfig.title,
                window.location.pathname + window.location.search + '#' + routeConfig.path
            );
        }
    }

    /**
     * 加载组件
     * @param {string} componentName - 组件名称
     */
    async loadComponent(componentName) {
        const contentContainer = document.getElementById('app-content');
        if (!contentContainer) {
            throw new Error('内容容器不存在');
        }

        // 添加加载动画
        contentContainer.classList.add('loading');

        try {
            // 动态加载组件
            const component = await this.loadComponentModule(componentName);

            // 渲染组件
            await component.render(contentContainer);

            // 滚动到顶部
            if (AppConfig.PAGE.SMOOTH_SCROLL) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                window.scrollTo(0, 0);
            }

        } finally {
            // 移除加载动画
            setTimeout(() => {
                contentContainer.classList.remove('loading');
            }, AppConfig.PAGE.ANIMATION_DURATION);
        }
    }

    /**
     * 动态加载组件模块
     * @param {string} componentName - 组件名称
     * @returns {Promise<Object>} 组件实例
     */
    async loadComponentModule(componentName) {
        const componentPath = `js/components/${componentName}.js`;

        try {
            // 检查组件是否已加载
            if (window[`${componentName}Component`]) {
                return window[`${componentName}Component`];
            }

            // 动态加载组件文件
            await this.loadScript(componentPath);

            // 等待组件初始化
            const maxWaitTime = 5000;
            const startTime = Date.now();

            while (!window[`${componentName}Component`] && Date.now() - startTime < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (!window[`${componentName}Component`]) {
                throw new Error(`组件 ${componentName} 加载失败`);
            }

            return window[`${componentName}Component`];

        } catch (error) {
            this.logError('加载组件模块失败', error);
            throw error;
        }
    }

    /**
     * 动态加载脚本文件
     * @param {string} src - 脚本路径
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 更新路由历史
     * @param {Object} routeConfig - 路由配置
     */
    updateHistory(routeConfig) {
        this.history.push({
            path: routeConfig.path,
            title: routeConfig.title,
            timestamp: Date.now()
        });

        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 重定向到登录页
     */
    async redirectToLogin() {
        await this.navigate(AppConfig.ROUTES.LOGIN, { replaceState: true });
    }

    /**
     * 重定向到默认路由
     */
    async redirectToDefaultRoute() {
        const authManager = window.authManager || window.AuthManager;
        const user = authManager.getCurrentUser();
        const defaultRoute = user?.role === AppConfig.USER_ROLES.ADMIN
            ? AppConfig.ROUTES.ADMIN
            : AppConfig.ROUTES.MAIN;

        await this.navigate(defaultRoute);
    }

    /**
     * 获取当前路由
     * @returns {Object|null} 当前路由配置
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * 获取当前路径
     * @returns {string} 当前路径
     */
    getCurrentPath() {
        return this.currentRoute?.path || '';
    }

    /**
     * 检查是否可以返回
     * @returns {boolean} 是否可以返回
     */
    canGoBack() {
        return this.history.length > 1;
    }

    /**
     * 返回上一页
     */
    goBack() {
        if (this.canGoBack()) {
            window.history.back();
        }
    }

    /**
     * 刷新当前页面
     */
    async refresh() {
        if (this.currentRoute) {
            await this.performRouteChange(this.currentRoute, { replaceState: true });
        }
    }

    /**
     * 处理浏览器前进后退
     */
    async handlePopState(event) {
        const state = event.state;
        if (state && state.path) {
            await this.navigate(state.path, { replaceState: true });
        }
    }

    /**
     * 处理链接点击
     * @param {Event} event - 点击事件
     */
    handleLinkClick(event) {
        const link = event.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        // 只处理内部路由链接
        if (href && href.startsWith('#')) {
            event.preventDefault();
            const path = href.substring(1);
            this.navigate(path);
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
     * 记录调试日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logDebug(message, data) {
        if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.CONSOLE_LOGS) {
            console.log(`🛣️ [Router] ${message}`, data);
        }
    }

    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logInfo(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.info(`🛣️ [Router] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.error(`🛣️ [Router] ${message}`, error);
        }
    }
}

// 创建全局路由管理器实例
window.router = new Router();
window.Router = Router; // 兼容启动脚本检查

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}