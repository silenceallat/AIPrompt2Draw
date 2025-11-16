/**
 * AIPrompt2Draw 应用配置
 * 统一管理应用的全局配置和常量
 */

// 应用基础信息
window.AppConfig = {
    // 应用信息
    APP_NAME: '一语成图',
    APP_VERSION: '2.0.0',
    APP_DESCRIPTION: 'AI流程图生成器',

    // API配置
    API_BASE_URL: '/api',
    API_VERSION: 'v1',

    // 路由配置
    ROUTES: {
        LOGIN: 'login',
        MAIN: 'main',
        PROFILE: 'profile',
        ADMIN: 'admin'
    },

    // 认证配置
    AUTH: {
        TOKEN_KEY: 'token',
        USER_KEY: 'user',
        TOKEN_EXPIRY_KEY: 'tokenExpiry',
        // 服务端期望裸 token，不再添加 Bearer 前缀
        BEARER_PREFIX: '',
        // Token有效期（毫秒）
        TOKEN_EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24小时

        // 自动刷新Token配置
        AUTO_REFRESH: true,
        REFRESH_THRESHOLD: 5 * 60 * 1000 // 5分钟前刷新
    },

    // 用户角色
    USER_ROLES: {
        USER: 'user',
        ADMIN: 'admin'
    },

    // 主题配置
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },

    // 默认配置
    DEFAULTS: {
        THEME: 'light',
        LANGUAGE: 'zh-CN',
        PAGE_SIZE: 20
    },

    // 错误码映射
    ERROR_CODES: {
        SUCCESS: 200,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500
    },

    // 网络配置
    NETWORK: {
        TIMEOUT: 30000, // 30秒
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000 // 1秒
    },

    // 页面配置
    PAGE: {
        LOADING_TIMEOUT: 5000, // 页面加载超时时间
        SMOOTH_SCROLL: true,
        ANIMATION_DURATION: 300 // 页面切换动画时长
    },

    // 调试配置
    DEBUG: {
        ENABLED: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        CONSOLE_LOGS: true,
        NETWORK_LOGS: false
    }
};

// API端点配置
window.ApiEndpoints = {
    // 认证相关
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify',
        REFRESH: '/auth/refresh'
    },

    // 用户管理
    USER: {
        PROFILE: '/user/profile',
        UPDATE_PROFILE: '/user/profile',
        CHANGE_PASSWORD: '/user/password',
        USAGE_STATS: '/user/usage',
        LOGIN_HISTORY: '/user/history'
    },

    // 管理员
    ADMIN: {
        USERS: '/admin/users',
        USER_DETAIL: '/admin/users',
        RESET_PASSWORD: '/admin/reset-password',
        USAGE_OVERVIEW: '/admin/usage/overview',
        SYSTEM_CONFIG: '/admin/config'
    },

    // API密钥管理
    API_KEY: {
        LIST: '/api-keys',
        CREATE: '/api-keys',
        UPDATE: '/api-keys',
        DELETE: '/api-keys',
        VALIDATE: '/api-keys/validate'
    },

    // AI模型管理
    MODEL: {
        LIST: '/models',
        CREATE: '/models',
        UPDATE: '/models',
        DELETE: '/models',
        TEST: '/models/test'
    },

    // 流程图生成
    FLOWCHART: {
        GENERATE: '/flowchart/generate',
        SAVE: '/flowchart/save',
        LOAD: '/flowchart/load',
        EXPORT: '/flowchart/export'
    }
};

// 事件名称常量
window.AppEvents = {
    // 应用事件
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',

    // 路由事件
    ROUTE_CHANGE: 'route:change',
    ROUTE_BEFORE_CHANGE: 'route:beforeChange',

    // 认证事件
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_TOKEN_EXPIRED: 'auth:tokenExpired',
    AUTH_TOKEN_REFRESHED: 'auth:tokenRefreshed',

    // 用户事件
    USER_PROFILE_UPDATED: 'user:profileUpdated',
    USER_SETTINGS_CHANGED: 'user:settingsChanged',

    // 主题事件
    THEME_CHANGED: 'theme:changed',

    // 模态框事件
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',

    // 网络事件
    NETWORK_REQUEST_START: 'network:requestStart',
    NETWORK_REQUEST_SUCCESS: 'network:requestSuccess',
    NETWORK_REQUEST_ERROR: 'network:requestError'
};

// 本地存储键名
window.StorageKeys = {
    TOKEN: AppConfig.AUTH.TOKEN_KEY,
    USER: AppConfig.AUTH.USER_KEY,
    TOKEN_EXPIRY: AppConfig.AUTH.TOKEN_EXPIRY_KEY,
    THEME: 'theme',
    LANGUAGE: 'language',
    SETTINGS: 'settings',
    CHAT_HISTORY: 'chatHistory',
    API_CONFIG: 'apiConfig'
};

// 默认用户设置
window.DefaultSettings = {
    theme: AppConfig.DEFAULTS.THEME,
    language: AppConfig.DEFAULTS.LANGUAGE,
    sendHistory: true,
    autoSave: true,
    showTips: true,
    animations: true
};

// 控制台日志函数（仅在调试模式下输出）
if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.CONSOLE_LOGS) {
    console.log('🚀 AIPrompt2Draw 配置已加载', {
        version: AppConfig.APP_VERSION,
        debug: AppConfig.DEBUG.ENABLED,
        environment: window.location.hostname
    });
}
