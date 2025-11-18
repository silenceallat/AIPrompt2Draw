/**
 * AI服务配置管理模块
 * 负责AI服务商配置的管理、保存和加载
 */

class AIConfigService {
    constructor() {
        // AI服务商预设配置
        this.providerPresets = {
            'siliconflow': {
                apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
                authScheme: 'Bearer',
                models: [
                    'zai-org/GLM-4.6',
                    'Qwen/Qwen3-Coder-480B-A35B-Instruct',
                    'deepseek-ai/DeepSeek-V3.2-Exp',
                    'moonshotai/Kimi-K2-Instruct-0905',
                    'MiniMaxAI/MiniMax-M2'
                ]
            },
            'openrouter': {
                apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
                authScheme: 'Bearer',
                models: [
                    'anthropic/claude-haiku-4.5',
                    'anthropic/claude-sonnet-4.5',
                    'openai/gpt-5',
                    'openai/gpt-5-mini',
                    'openai/gpt-5-nano',
                    'openai/gpt-4.1',
                    'openai/gpt-4o',
                    'openai/o3',
                    'openai/o3-mini',
                    'openai/o1',
                    'google/gemini-2.5-pro',
                    'google/gemini-2.5-flash',
                    'mistralai/mistral-large',
                    'zhipu/glm-4.6'
                ]
            },
            'kimi': {
                apiUrl: 'https://api.moonshot.cn/v1/chat/completions',
                authScheme: 'Bearer',
                models: [
                    'kimi-k2-thinking',
                    'kimi-k2-0905-preview',
                    'kimi-k2-turbo-preview'
                ]
            },
            'zhipu': {
                apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                authScheme: 'Bearer',
                models: [
                    'glm-4.6',
                    'glm-4.5',
                    'glm-4.5-air'
                ]
            },
            'minimax': {
                apiUrl: 'https://api.minimax.chat/v1/text/chatcompletion_pro',
                authScheme: 'Bearer',
                models: [
                    'abab6.5s-chat',
                    'abab6.5-chat',
                    'abab6-chat'
                ]
            },
            'modelscope': {
                apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                authScheme: 'Bearer',
                models: [
                    'qwen-coder-plus',
                    'qwen2.5-coder-32b-instruct',
                    'qwen2.5-72b-instruct',
                    'qwen2.5-32b-instruct',
                    'qwen2.5-14b-instruct',
                    'qwen2.5-7b-instruct'
                ]
            }
        };

        // 默认配置
        this.defaultConfig = {
            provider: 'siliconflow',
            apiKeys: {},
            model: '',
            apiUrl: '',
            stream: true,
            authScheme: 'Bearer',
            sendHistory: true,
            temperature: 0.7,
            maxTokens: 2000
        };

        // 当前配置
        this.config = { ...this.defaultConfig };

        // 事件监听器
        this.eventTarget = new EventTarget();

        // 初始化
        this.init();
    }

    /**
     * 初始化配置服务
     */
    init() {
        this.loadFromStorage();
        this.logDebug('AI配置服务已初始化');
    }

    /**
     * 从本地存储加载配置
     */
    loadFromStorage() {
        try {
            const savedConfig = this.getStorageItem('ai-config');
            if (savedConfig) {
                this.config = { ...this.defaultConfig, ...savedConfig };
                this.logDebug('从本地存储加载配置', { provider: this.config.provider });
            }
        } catch (error) {
            this.logError('加载配置失败', error);
            this.config = { ...this.defaultConfig };
        }
    }

    /**
     * 从后端加载用户配置
     */
    async loadFromBackend() {
        try {
            if (!window.apiClient) {
                this.logDebug('API客户端未初始化，跳过后端配置加载');
                return false;
            }

            const response = await window.apiClient.get('/v1/user/config');
            if (response.success && response.data) {
                // 合并后端配置到本地配置
                const backendConfig = response.data;
                this.config = { ...this.config, ...backendConfig };

                // 保存到本地存储
                this.saveToStorage();

                this.logDebug('从后端加载配置成功', backendConfig);
                this.emitEvent('backendConfigLoaded', backendConfig);
                return true;
            }
        } catch (error) {
            this.logDebug('从后端加载配置失败，使用本地配置', error);
        }
        return false;
    }

    /**
     * 保存配置到本地存储
     */
    saveToStorage() {
        try {
            this.setStorageItem('ai-config', this.config);
            this.logDebug('配置已保存到本地存储');
            return true;
        } catch (error) {
            this.logError('保存配置失败', error);
            return false;
        }
    }

    /**
     * 同步配置到后端
     */
    async syncToBackend() {
        try {
            if (!window.apiClient) {
                this.logDebug('API客户端未初始化，跳过后端配置同步');
                return false;
            }

            // 准备要同步的配置数据（排除敏感信息）
            const syncConfig = {
                provider: this.config.provider,
                model: this.config.model,
                apiUrl: this.config.apiUrl,
                stream: this.config.stream,
                sendHistory: this.config.sendHistory,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens
            };

            const response = await window.apiClient.post('/v1/user/config', syncConfig);
            if (response.success) {
                this.logDebug('配置同步到后端成功', syncConfig);
                this.emitEvent('backendConfigSynced', syncConfig);
                return true;
            }
        } catch (error) {
            this.logDebug('配置同步到后端失败', error);
        }
        return false;
    }

    /**
     * 获取配置
     * @param {string} key - 配置键名
     * @returns {*} 配置值
     */
    getConfig(key) {
        if (key) {
            return this.config[key];
        }
        return { ...this.config };
    }

    /**
     * 设置配置
     * @param {string|object} keyOrConfig - 配置键名或配置对象
     * @param {*} value - 配置值
     * @param {boolean} syncToBackend - 是否同步到后端
     * @returns {boolean} 是否设置成功
     */
    async setConfig(keyOrConfig, value, syncToBackend = true) {
        let changed = false;

        if (typeof keyOrConfig === 'object' && keyOrConfig !== null) {
            // 批量设置配置
            Object.keys(keyOrConfig).forEach(key => {
                if (this.config[key] !== keyOrConfig[key]) {
                    this.config[key] = keyOrConfig[key];
                    changed = true;
                }
            });
        } else {
            // 单个设置配置
            if (this.config[keyOrConfig] !== value) {
                this.config[keyOrConfig] = value;
                changed = true;
            }
        }

        if (changed) {
            this.saveToStorage();

            // 尝试同步到后端
            if (syncToBackend) {
                await this.syncToBackend();
            }

            this.emitEvent('configChanged', this.config);
            this.logDebug('配置已更新', { keyOrConfig, value, syncToBackend });
        }

        return changed;
    }

    /**
     * 获取当前服务商信息
     * @returns {object} 服务商信息
     */
    getCurrentProvider() {
        return {
            provider: this.config.provider,
            preset: this.providerPresets[this.config.provider],
            hasApiKey: !!this.config.apiKeys[this.config.provider]
        };
    }

    /**
     * 设置当前服务商
     * @param {string} provider - 服务商名称
     * @returns {boolean} 是否设置成功
     */
    setProvider(provider) {
        if (!this.providerPresets[provider]) {
            this.logError('不支持的服务商', { provider });
            return false;
        }

        const preset = this.providerPresets[provider];

        this.setConfig({
            provider: provider,
            apiUrl: preset.apiUrl,
            authScheme: preset.authScheme,
            model: preset.models[0] || ''
        });

        this.emitEvent('providerChanged', { provider, preset });
        return true;
    }

    /**
     * 设置API密钥
     * @param {string} provider - 服务商名称
     * @param {string} apiKey - API密钥
     * @returns {boolean} 是否设置成功
     */
    setApiKey(provider, apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            delete this.config.apiKeys[provider];
        } else {
            this.config.apiKeys[provider] = apiKey.trim();
        }

        const apiKeys = { ...this.config.apiKeys };
        this.setConfig('apiKeys', apiKeys);

        this.emitEvent('apiKeyChanged', { provider, hasKey: !!apiKey });
        return true;
    }

    /**
     * 获取API密钥
     * @param {string} provider - 服务商名称
     * @returns {string|null} API密钥
     */
    getApiKey(provider) {
        return this.config.apiKeys[provider] || null;
    }

    /**
     * 检查当前服务商是否已配置API密钥
     * @returns {boolean} 是否已配置
     */
    hasCurrentApiKey() {
        return !!this.config.apiKeys[this.config.provider];
    }

    /**
     * 获取当前服务商的可用模型列表
     * @returns {string[]} 模型列表
     */
    getAvailableModels() {
        const preset = this.providerPresets[this.config.provider];
        return preset ? preset.models : [];
    }

    /**
     * 设置模型
     * @param {string} model - 模型名称
     * @returns {boolean} 是否设置成功
     */
    setModel(model) {
        const availableModels = this.getAvailableModels();
        if (!availableModels.includes(model)) {
            this.logError('不支持的模型', { model, availableModels });
            return false;
        }

        return this.setConfig('model', model);
    }

    /**
     * 导出配置
     * @returns {string} 配置JSON字符串
     */
    exportConfig() {
        const exportData = {
            provider: this.config.provider,
            apiKeys: this.config.apiKeys,
            model: this.config.model,
            apiUrl: this.config.apiUrl,
            stream: this.config.stream,
            authScheme: this.config.authScheme,
            sendHistory: this.config.sendHistory,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
            exportTime: new Date().toISOString()
        };

        try {
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            this.logError('导出配置失败', error);
            return null;
        }
    }

    /**
     * 导入配置
     * @param {string|object} configData - 配置数据
     * @returns {boolean} 是否导入成功
     */
    importConfig(configData) {
        try {
            let config;
            if (typeof configData === 'string') {
                config = JSON.parse(configData);
            } else {
                config = configData;
            }

            // 验证配置数据
            if (!config || typeof config !== 'object') {
                throw new Error('无效的配置数据');
            }

            // 验证必要字段
            if (config.provider && !this.providerPresets[config.provider]) {
                throw new Error(`不支持的服务商: ${config.provider}`);
            }

            // 合并配置
            const newConfig = { ...this.defaultConfig };

            if (config.provider) {
                const preset = this.providerPresets[config.provider];
                newConfig.provider = config.provider;
                newConfig.apiUrl = preset.apiUrl;
                newConfig.authScheme = preset.authScheme;
            }

            if (config.apiKeys && typeof config.apiKeys === 'object') {
                newConfig.apiKeys = config.apiKeys;
            }

            if (config.model) {
                newConfig.model = config.model;
            }

            if (typeof config.stream === 'boolean') {
                newConfig.stream = config.stream;
            }

            if (typeof config.sendHistory === 'boolean') {
                newConfig.sendHistory = config.sendHistory;
            }

            if (typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 2) {
                newConfig.temperature = config.temperature;
            }

            if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
                newConfig.maxTokens = config.maxTokens;
            }

            // 应用新配置
            Object.keys(newConfig).forEach(key => {
                this.config[key] = newConfig[key];
            });

            this.saveToStorage();
            this.emitEvent('configImported', this.config);
            this.logDebug('配置导入成功');

            return true;
        } catch (error) {
            this.logError('导入配置失败', error);
            return false;
        }
    }

    /**
     * 重置配置为默认值
     */
    resetConfig() {
        this.config = { ...this.defaultConfig };
        this.saveToStorage();
        this.emitEvent('configReset', this.config);
        this.logDebug('配置已重置为默认值');
    }

    /**
     * 获取服务商预设配置
     * @param {string} provider - 服务商名称
     * @returns {object|null} 预设配置
     */
    getProviderPreset(provider) {
        return this.providerPresets[provider] || null;
    }

    /**
     * 获取所有可用服务商
     * @returns {string[]} 服务商列表
     */
    getAvailableProviders() {
        return Object.keys(this.providerPresets);
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
     * 安全地获取本地存储项
     * @param {string} key - 存储键
     * @returns {*} 存储值
     */
    getStorageItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            this.logError('获取存储项失败', { key, error });
            return null;
        }
    }

    /**
     * 安全地设置本地存储项
     * @param {string} key - 存储键
     * @param {*} value - 存储值
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            this.logError('设置存储项失败', { key, value, error });
        }
    }

    /**
     * 记录调试日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logDebug(message, data) {
        if (window.AppConfig?.DEBUG?.ENABLED && window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.log(`🤖 [AIConfig] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.error(`❌ [AIConfig] ${message}`, error);
        }
    }
}

// 创建全局实例
window.aiConfigService = new AIConfigService();
window.AIConfigService = AIConfigService;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIConfigService;
}