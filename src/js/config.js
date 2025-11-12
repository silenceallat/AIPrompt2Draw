/**
 * AIPrompt2Draw - 配置管理模块
 * 负责API配置、用户设置的管理
 */

// API服务商预设配置
const providerPresets = {
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
        apiUrl: 'https://api.minimax.chat/v1/chat/completions',
        authScheme: 'Bearer',
        models: [
            'MiniMax-M2',
            'MiniMax-M2-Stable'
        ]
    },
    'modelscope': {
        apiUrl: 'https://cors-proxy.fringe.zone/https://api.modelscope.cn/api-open/v1/chat/completions',
        authScheme: 'Direct',
        models: [
            'Qwen/Qwen3-Coder-480B-A35B-Instruct',
            'moonshotai/Kimi-K2-Thinking',
            'ZhipuAI/GLM-4.6',
            'MiniMax/MiniMax-M2',
            'deepseek-ai/DeepSeek-V3.2-Exp'
        ]
    },
    'custom': {
        apiUrl: '',
        authScheme: 'Bearer',
        models: []
    }
};

// 配置管理类
class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    // 从localStorage加载配置
    loadConfig() {
        return {
            apiKeys: JSON.parse(localStorage.getItem('config_apiKeys')) || {},
            apiUrl: localStorage.getItem('config_apiUrl') || 'https://api.siliconflow.cn/v1/chat/completions',
            model: localStorage.getItem('config_model') || 'zai-org/GLM-4.6',
            stream: localStorage.getItem('config_stream') !== 'false',
            provider: localStorage.getItem('config_provider') || 'siliconflow',
            authScheme: localStorage.getItem('config_authScheme') || 'Bearer',
            sendHistory: localStorage.getItem('config_sendHistory') === 'true'
        };
    }

    // 保存配置到localStorage
    saveConfig(configData = null) {
        const dataToSave = configData || this.config;

        localStorage.setItem('config_apiKeys', JSON.stringify(dataToSave.apiKeys));
        localStorage.setItem('config_apiUrl', dataToSave.apiUrl);
        localStorage.setItem('config_model', dataToSave.model);
        localStorage.setItem('config_stream', dataToSave.stream);
        localStorage.setItem('config_provider', dataToSave.provider);
        localStorage.setItem('config_authScheme', dataToSave.authScheme);
        localStorage.setItem('config_sendHistory', dataToSave.sendHistory);
    }

    // 更新配置项
    updateConfig(updates) {
        Object.assign(this.config, updates);
        this.saveConfig();
    }

    // 设置当前服务商的API Key
    setApiKey(provider, apiKey) {
        this.config.apiKeys[provider] = apiKey;
        this.saveConfig();
    }

    // 获取当前服务商的API Key
    getApiKey(provider = null) {
        const targetProvider = provider || this.config.provider;
        return this.config.apiKeys[targetProvider];
    }

    // 检查当前配置是否有效
    isConfigValid() {
        const currentProvider = this.config.provider;
        return !!this.config.apiKeys[currentProvider];
    }

    // 导出配置
    exportConfig() {
        return {
            ...this.config,
            exportTime: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // 导入配置
    importConfig(importedConfig) {
        if (!importedConfig.apiKeys || !importedConfig.apiUrl || !importedConfig.model) {
            throw new Error('无效的配置文件，缺少关键字段');
        }

        // 验证并合并配置
        Object.assign(this.config, importedConfig);
        this.saveConfig();
        return true;
    }

    // 重置配置
    resetConfig() {
        this.config = {
            apiKeys: {},
            apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'zai-org/GLM-4.6',
            stream: true,
            provider: 'siliconflow',
            authScheme: 'Bearer',
            sendHistory: false
        };
        this.saveConfig();
    }

    // 获取当前配置
    getConfig() {
        return { ...this.config };
    }
}

// 全局配置实例
const configManager = new ConfigManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigManager, configManager, providerPresets };
} else {
    window.ConfigManager = ConfigManager;
    window.configManager = configManager;
    window.providerPresets = providerPresets;
}