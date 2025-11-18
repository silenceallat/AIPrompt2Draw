/**
 * 聊天服务
 * 负责管理AI对话、消息发送和响应处理
 */

class ChatService {
    constructor() {
        // 事件监听器
        this.eventTarget = new EventTarget();

        // 当前对话状态
        this.currentConversation = [];
        this.isProcessing = false;

        // 配置
        this.config = {
            maxHistoryLength: 20, // 最大历史记录长度
            retryAttempts: 3,    // 重试次数
            timeoutMs: 60000      // 请求超时时间
        };

        // 初始化
        this.init();
    }

    /**
     * 初始化聊天服务
     */
    init() {
        this.logDebug('聊天服务已初始化');
    }

    /**
     * 发送消息
     * @param {string} message - 用户消息
     * @param {object} options - 发送选项
     * @returns {Promise<object>} 响应结果
     */
    async sendMessage(message, options = {}) {
        if (this.isProcessing) {
            throw new Error('正在处理其他请求，请稍候');
        }

        if (!message || !message.trim()) {
            throw new Error('消息不能为空');
        }

        this.isProcessing = true;

        try {
            // 触发发送开始事件
            this.emitEvent('messageSending', { message, options });

            // 根据模式选择发送方式
            const result = options.useBackend
                ? await this.sendViaBackend(message, options)
                : await this.sendDirectly(message, options);

            // 添加到对话历史
            this.addToHistory({
                role: 'user',
                content: message,
                timestamp: new Date()
            });

            if (result.success) {
                this.addToHistory({
                    role: 'assistant',
                    content: result.content,
                    xml: result.xml,
                    usage: result.usage,
                    timestamp: new Date()
                });
            }

            // 触发发送完成事件
            this.emitEvent('messageSent', { message, result, options });

            return result;

        } catch (error) {
            this.logError('发送消息失败', error);
            this.emitEvent('messageError', { message, error, options });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 通过后端发送消息
     * @param {string} message - 用户消息
     * @param {object} options - 发送选项
     * @returns {Promise<object>} 响应结果
     */
    async sendViaBackend(message, options = {}) {
        if (!window.apiClient) {
            throw new Error('API客户端未初始化');
        }

        // 获取AI配置
        const aiConfigService = window.aiConfigService;
        if (!aiConfigService || !aiConfigService.hasCurrentApiKey()) {
            throw new Error('请先配置API密钥');
        }

        // 准备请求数据
        const requestData = {
            prompt: message,
            provider: aiConfigService.getConfig('provider'),
            model: aiConfigService.getConfig('model'),
            stream: options.stream !== false && aiConfigService.getConfig('stream'),
            temperature: aiConfigService.getConfig('temperature'),
            maxTokens: aiConfigService.getConfig('maxTokens'),
            sendHistory: options.sendHistory !== false && aiConfigService.getConfig('sendHistory'),
            conversationHistory: this.getConversationHistory(options.sendHistory !== false)
        };

        this.logDebug('发送请求到后端', requestData);

        try {
            let response;

            // 使用用户认证的端点
            if (requestData.stream) {
                response = await this.handleStreamingBackendRequest(requestData, '/api/v1/user/generate');
            } else {
                response = await this.handleNormalBackendRequest(requestData, '/api/v1/user/generate');
            }

            return {
                success: true,
                content: response.data?.content || '流程图生成完成',
                xml: response.data?.xml,
                usage: response.data?.usage,
                model: requestData.model,
                provider: requestData.provider
            };

        } catch (error) {
            // 处理后端错误响应
            if (error.response) {
                const errorMessage = error.response.data?.message || error.response.statusText || '服务器错误';
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error('网络请求失败，请检查网络连接');
            } else {
                throw error;
            }
        }
    }

    /**
     * 处理流式后端请求
     * @param {object} requestData - 请求数据
     * @param {string} endpoint - API端点
     * @returns {Promise<object>} 响应结果
     */
    async handleStreamingBackendRequest(requestData, endpoint = '/v1/generate') {
        // 触发流式开始事件
        this.emitEvent('streamingStarted', { requestData });

        try {
            const response = await window.apiClient.post(endpoint, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.config.timeoutMs
            });

            this.emitEvent('streamingCompleted', { response });
            return response;

        } catch (error) {
            this.emitEvent('streamingError', { requestData, error });
            throw error;
        }
    }

    /**
     * 处理普通后端请求
     * @param {object} requestData - 请求数据
     * @param {string} endpoint - API端点
     * @returns {Promise<object>} 响应结果
     */
    async handleNormalBackendRequest(requestData, endpoint = '/v1/generate') {
        let lastError;

        // 重试机制
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                this.logDebug(`发送请求 (尝试 ${attempt}/${this.config.retryAttempts})`, requestData);

                const response = await window.apiClient.post(endpoint, requestData, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: this.config.timeoutMs
                });

                return response;

            } catch (error) {
                lastError = error;
                this.logDebug(`请求失败 (尝试 ${attempt}/${this.config.retryAttempts})`, error);

                if (attempt < this.config.retryAttempts) {
                    // 等待后重试
                    await this.delay(1000 * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * 直接发送消息到AI服务商（前端模式）
     * @param {string} message - 用户消息
     * @param {object} options - 发送选项
     * @returns {Promise<object>} 响应结果
     */
    async sendDirectly(message, options = {}) {
        // 触发直接发送开始事件
        this.emitEvent('directSendingStarted', { message, options });

        try {
            // 模拟AI响应（实际项目中这里会调用AI服务商API）
            await this.delay(2000); // 模拟处理时间

            const mockResponse = {
                content: '这是一个模拟的AI响应。实际的AI功能需要配置API Key或切换到后端模式。',
                xml: this.generateMockXML(),
                usage: {
                    promptTokens: message.length,
                    completionTokens: 50,
                    totalTokens: message.length + 50
                }
            };

            this.emitEvent('directSendingCompleted', { message, result: mockResponse });

            return {
                success: true,
                ...mockResponse
            };

        } catch (error) {
            this.emitEvent('directSendingError', { message, error });
            throw error;
        }
    }

    /**
     * 生成模拟XML
     * @returns {string} 模拟的DrawIO XML
     */
    generateMockXML() {
        return `<mxGraphModel>
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0" value="开始">
                    <mxGeometry x="100" y="100" width="80" height="40" as="geometry"/>
                </mxCell>
                <mxCell id="2" parent="0" value="处理">
                    <mxGeometry x="250" y="100" width="80" height="40" as="geometry"/>
                </mxCell>
                <mxCell id="3" parent="0" value="结束">
                    <mxGeometry x="400" y="100" width="80" height="40" as="geometry"/>
                </mxCell>
            </root>
        </mxGraphModel>`;
    }

    /**
     * 获取对话历史
     * @param {boolean} includeAll - 是否包含所有历史
     * @returns {Array} 对话历史
     */
    getConversationHistory(includeAll = false) {
        if (includeAll) {
            return [...this.currentConversation];
        }

        // 返回最近的历史记录
        const startIndex = Math.max(0, this.currentConversation.length - this.config.maxHistoryLength);
        return this.currentConversation.slice(startIndex);
    }

    /**
     * 添加到对话历史
     * @param {object} message - 消息对象
     */
    addToHistory(message) {
        this.currentConversation.push(message);

        // 限制历史记录长度
        if (this.currentConversation.length > this.config.maxHistoryLength * 2) {
            this.currentConversation = this.currentConversation.slice(-this.config.maxHistoryLength);
        }

        this.logDebug('添加消息到历史', { message, historyLength: this.currentConversation.length });
    }

    /**
     * 清空对话历史
     */
    clearHistory() {
        this.currentConversation = [];
        this.logDebug('对话历史已清空');
        this.emitEvent('historyCleared');
    }

    /**
     * 获取当前状态
     * @returns {object} 当前状态
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            conversationLength: this.currentConversation.length,
            config: { ...this.config }
        };
    }

    /**
     * 更新配置
     * @param {object} newConfig - 新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logDebug('配置已更新', { newConfig });
        this.emitEvent('configUpdated', this.config);
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {*} detail - 事件详情
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
        if (window.AppConfig?.DEBUG?.ENABLED && window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.log(`💬 [ChatService] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.error(`❌ [ChatService] ${message}`, error);
        }
    }
}

// 创建全局实例
window.chatService = new ChatService();
window.ChatService = ChatService;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatService;
}