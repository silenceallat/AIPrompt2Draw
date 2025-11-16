/**
 * API客户端模块
 * 统一处理所有API请求，包括认证、错误处理和响应格式化
 */

class ApiClient {
    constructor() {
        this.baseURL = AppConfig.API_BASE_URL;
        this.timeout = AppConfig.NETWORK.TIMEOUT;
        this.retryCount = AppConfig.NETWORK.RETRY_COUNT;
        this.retryDelay = AppConfig.NETWORK.RETRY_DELAY;

        // 绑定方法
        this.handleResponse = this.handleResponse.bind(this);
        this.handleNetworkError = this.handleNetworkError.bind(this);
    }

    /**
     * 通用请求方法
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    async request(method, endpoint, options = {}) {
        const {
            data = null,
            params = {},
            headers = {},
            requireAuth = true,
            timeout = this.timeout,
            retries = this.retryCount
        } = options;

        // 构建完整URL
        let url = `${this.baseURL}${endpoint}`;
        if (Object.keys(params).length > 0) {
            url += '?' + new URLSearchParams(params).toString();
        }

        // 构建请求配置
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            timeout: timeout
        };

        // 添加认证头
        if (requireAuth) {
            try {
                const authManager = window.authManager || window.AuthManager;
                if (!authManager) {
                    throw new Error('认证管理器未初始化');
                }

                const authHeaders = authManager.getAuthHeaders();
                if (authHeaders) {
                    Object.assign(config.headers, authHeaders);
                }
            } catch (error) {
                this.logError('获取认证头失败', error);
                throw new Error('认证失败，请重新登录');
            }
        }

        // 添加请求体
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            config.body = JSON.stringify(data);
        }

        let lastError = null;

        // 重试机制
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                this.logDebug('API请求', {
                    method,
                    url,
                    attempt: attempt + 1,
                    requireAuth
                });

                // 发送请求
                const response = await fetch(url, config);
                return await this.handleResponse(response);

            } catch (error) {
                lastError = error;

                // 如果是认证错误，不进行重试
                if (this.isAuthError(error)) {
                    throw error;
                }

                // 最后一次重试失败，抛出错误
                if (attempt === retries) {
                    throw this.handleNetworkError(error);
                }

                // 等待后重试
                await this.delay(this.retryDelay * (attempt + 1));
                this.logWarning(`请求失败，正在重试... (${attempt + 1}/${retries + 1})`, {
                    url: endpoint,
                    error: error.message
                });
            }
        }

        throw lastError;
    }

    /**
     * 处理响应
     * @param {Response} response - 响应对象
     * @returns {Promise} 处理后的响应数据
     */
    async handleResponse(response) {
        const { status, headers } = response;
        const contentType = headers.get('content-type') || '';

        this.logDebug('API响应', {
            status,
            contentType,
            url: response.url
        });

        // 检查响应状态
        if (!response.ok) {
            const error = new Error(`HTTP ${status}: ${response.statusText}`);
            error.status = status;
            error.statusText = response.statusText;
            error.response = response;

            // 处理特定的HTTP状态码
            if (status === 401) {
                this.handleUnauthorized();
            } else if (status === 403) {
                this.handleForbidden();
            } else if (status === 404) {
                this.handleNotFound();
            } else if (status >= 500) {
                this.handleServerError();
            }

            throw error;
        }

        // 解析响应体
        try {
            let responseData;

            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else if (contentType.includes('text/')) {
                responseData = await response.text();
            } else {
                responseData = await response.blob();
            }

            // 检查业务状态码
            if (responseData && typeof responseData === 'object' && 'success' in responseData) {
                if (!responseData.success) {
                    const error = new Error(responseData.message || '请求失败');
                    error.code = responseData.code;
                    error.data = responseData.data;
                    error.businessError = true;
                    throw error;
                }
            }

            this.logDebug('API响应成功', { status, url: response.url });

            return responseData;

        } catch (error) {
            this.logError('解析响应失败', error);
            throw new Error('响应解析失败');
        }
    }

    /**
     * 处理网络错误
     * @param {Error} error - 错误对象
     * @returns {Error} 处理后的错误
     */
    handleNetworkError(error) {
        const networkError = new Error(this.getNetworkErrorMessage(error));
        networkError.originalError = error;
        networkError.isNetworkError = true;

        this.logError('网络请求失败', error);

        // 触发网络错误事件
        this.emitNetworkError(networkError);

        return networkError;
    }

    /**
     * 获取网络错误消息
     * @param {Error} error - 原始错误
     * @returns {string} 错误消息
     */
    getNetworkErrorMessage(error) {
        if (error.name === 'AbortError') {
            return '请求已取消';
        }

        if (error.name === 'TimeoutError') {
            return '请求超时，请检查网络连接';
        }

        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
            return '网络连接失败，请检查服务器状态';
        }

        if (error.code === 'ENOTFOUND') {
            return '服务器地址未找到';
        }

        return error.message || '网络请求失败';
    }

    /**
     * 检查是否为认证错误
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否为认证错误
     */
    isAuthError(error) {
        return error.status === 401 || error.status === 403;
    }

    /**
     * 处理未授权错误
     */
    handleUnauthorized() {
        this.logWarning('用户未授权，需要登录');

        // 触发token过期事件
        const authManager = window.authManager || window.AuthManager;
        if (authManager) {
            authManager.handleTokenExpired();
        }

        // 清除认证信息
        this.clearAuthData();
    }

    /**
     * 处理禁止访问错误
     */
    handleForbidden() {
        this.logWarning('用户权限不足');

        // 可以显示权限不足的提示
        this.showPermissionError();
    }

    /**
     * 处理资源未找到错误
     */
    handleNotFound() {
        this.logWarning('请求的资源不存在');
    }

    /**
     * 处理服务器错误
     */
    handleServerError() {
        this.logError('服务器内部错误');
        this.showServerError();
    }

    /**
     * 清除认证数据
     */
    clearAuthData() {
        const authManager = window.authManager || window.AuthManager;
        if (authManager) {
            authManager.clearAuth();
        }
    }

    /**
     * 显示权限错误提示
     */
    showPermissionError() {
        if (window.app?.showNotification) {
            window.app.showNotification('权限不足，无法执行此操作', 'error');
        } else {
            alert('权限不足，无法执行此操作');
        }
    }

    /**
     * 显示服务器错误提示
     */
    showServerError() {
        if (window.app?.showNotification) {
            window.app.showNotification('服务器错误，请稍后重试', 'error');
        } else {
            alert('服务器错误，请稍后重试');
        }
    }

    /**
     * 触发网络错误事件
     * @param {Error} error - 错误对象
     */
    emitNetworkError(error) {
        if (window.app) {
            window.app.emitEvent(AppEvents.NETWORK_REQUEST_ERROR, {
                url: error.config?.url || 'unknown',
                error: error.message
            });
        }
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    get(endpoint, options = {}) {
        return this.request('GET', endpoint, options);
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    post(endpoint, data = null, options = {}) {
        return this.request('POST', endpoint, { ...options, data });
    }

    /**
     * PUT请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    put(endpoint, data = null, options = {}) {
        return this.request('PUT', endpoint, { ...options, data });
    }

    /**
     * PATCH请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请�数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    patch(endpoint, data = null, options = {}) {
        return this.request('PATCH', endpoint, { ...options, data });
    }

    /**
     * DELETE请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, options);
    }

    /**
     * 上传文件
     * @param {string} endpoint - API端点
     * @param {FormData} formData - 表单数据
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    upload(endpoint, formData, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const {
            headers = {},
            requireAuth = true,
            timeout = this.timeout * 2 // 上传超时时间加倍
        } = options;

        const config = {
            method: 'POST',
            body: formData,
            headers: {},
            timeout: timeout
        };

        // 添加认证头
        if (requireAuth) {
            try {
                const authManager = window.authManager || window.AuthManager;
                if (!authManager) {
                    throw new Error('认证管理器未初始化');
                }

                const authHeaders = authManager.getAuthHeaders();
                if (authHeaders) {
                    // 对于文件上传，只添加Authorization头，不设置Content-Type
                    if (authHeaders.Authorization) {
                        config.headers.Authorization = authHeaders.Authorization;
                    }
                }
            } catch (error) {
                this.logError('获取认证头失败', error);
                throw new Error('认证失败，请重新登录');
            }
        }

        // 添加其他头部
        Object.assign(config.headers, headers);

        return fetch(url, config)
            .then(this.handleResponse)
            .catch(this.handleNetworkError);
    }

    /**
     * 下载文件
     * @param {string} endpoint - API端点
     * @param {string} filename - 文件名
     * @param {Object} options - 请求选项
     * @returns {Promise} 下载Promise
     */
    async download(endpoint, filename, options = {}) {
        try {
            const response = await this.get(endpoint, {
                ...options,
                requireAuth: options.requireAuth !== false
            });

            // 创建下载链接
            const blob = new Blob([response]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            this.logInfo('文件下载成功', { filename });

        } catch (error) {
            this.logError('文件下载失败', error);
            throw error;
        }
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟时间（毫秒）
     * @returns {Promise} 延迟Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 记录调试日志
     */
    logDebug(message, data) {
        if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.NETWORK_LOGS) {
            console.log(`🌐 [ApiClient] ${message}`, data);
        }
    }

    /**
     * 记录信息日志
     */
    logInfo(message, data) {
        if (AppConfig.DEBUG.NETWORK_LOGS) {
            console.info(`🌐 [ApiClient] ${message}`, data);
        }
    }

    /**
     * 记录警告日志
     */
    logWarning(message, data) {
        if (AppConfig.DEBUG.NETWORK_LOGS) {
            console.warn(`⚠️ [ApiClient] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     */
    logError(message, error) {
        if (AppConfig.DEBUG.NETWORK_LOGS) {
            console.error(`❌ [ApiClient] ${message}`, error);
        }
    }
}

// 创建全局API客户端实例
window.apiClient = new ApiClient();

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}