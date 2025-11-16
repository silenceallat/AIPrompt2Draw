/**
 * AIPrompt2Draw - 后端集成配置管理模块
 * 负责后端API配置、用户设置的管理
 */

// 后端配置管理类
class BackendConfigManager {
    constructor() {
        this.config = this.loadConfig();
        this.backendMode = localStorage.getItem('use_backend_mode') === 'true';
    }

    // 从localStorage加载配置
    loadConfig() {
        return {
            backendApiKey: localStorage.getItem('backend_api_key') || '',
            useBackendMode: localStorage.getItem('use_backend_mode') === 'true',
            autoSaveConfig: localStorage.getItem('auto_save_config') !== 'false',
            theme: localStorage.getItem('theme') || 'light',
            sendHistory: localStorage.getItem('send_history') === 'true'
        };
    }

    // 保存配置到localStorage
    saveConfig(configData = null) {
        const dataToSave = configData || this.config;

        localStorage.setItem('backend_api_key', dataToSave.backendApiKey);
        localStorage.setItem('use_backend_mode', dataToSave.useBackendMode);
        localStorage.setItem('auto_save_config', dataToSave.autoSaveConfig);
        localStorage.setItem('theme', dataToSave.theme);
        localStorage.setItem('send_history', dataToSave.sendHistory);
    }

    // 更新配置项
    updateConfig(updates) {
        Object.assign(this.config, updates);
        this.saveConfig();
        this.backendMode = this.config.useBackendMode;
    }

    // 设置后端API Key
    setBackendApiKey(apiKey) {
        this.config.backendApiKey = apiKey;
        this.saveConfig();
    }

    // 获取后端API Key
    getBackendApiKey() {
        return this.config.backendApiKey;
    }

    // 设置使用后端模式
    setBackendMode(useBackend) {
        this.config.useBackendMode = useBackend;
        this.backendMode = useBackend;
        this.saveConfig();
    }

    // 获取是否使用后端模式
    isBackendMode() {
        return this.backendMode;
    }

    // 检查后端配置是否有效
    isBackendConfigValid() {
        return !!this.config.backendApiKey;
    }

    // 切换模式（前端/后端）
    async toggleMode() {
        const newMode = !this.backendMode;

        if (newMode && !this.isBackendConfigValid()) {
            // 切换到后端模式但API Key无效
            const apiKey = prompt('请输入后端API Key以启用后端模式:', this.config.backendApiKey || '');
            if (apiKey) {
                this.setBackendApiKey(apiKey);
                this.setBackendMode(true);
                return { success: true, mode: 'backend' };
            } else {
                return { success: false, mode: 'frontend', error: 'API Key未提供' };
            }
        } else {
            // 直接切换模式
            this.setBackendMode(newMode);
            return { success: true, mode: newMode ? 'backend' : 'frontend' };
        }
    }

    // 测试后端连接
    async testBackendConnection() {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch('/api/v1/user/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.code === 200) {
                    return {
                        success: true,
                        data: result.data,
                        message: '后端连接成功'
                    };
                } else {
                    return { success: false, error: result.message || '后端返回错误' };
                }
            } else {
                return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
        } catch (error) {
            console.error('测试连接失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // ===== 云端配置管理功能 =====

    // 获取云端配置列表
    async getCloudConfigs(configType = null) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const url = configType ?
                `/api/v1/user/configs?configType=${encodeURIComponent(configType)}` :
                '/api/v1/user/configs';

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || '获取云端配置失败' };
            }
        } catch (error) {
            console.error('获取云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 获取单个云端配置
    async getCloudConfig(configId) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch(`/api/v1/user/configs/${configId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || '获取云端配置失败' };
            }
        } catch (error) {
            console.error('获取云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 创建云端配置
    async createCloudConfig(configData) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch('/api/v1/user/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                },
                body: JSON.stringify(configData)
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || '创建云端配置失败' };
            }
        } catch (error) {
            console.error('创建云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 更新云端配置
    async updateCloudConfig(configId, configData) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch(`/api/v1/user/configs/${configId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                },
                body: JSON.stringify(configData)
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || '更新云端配置失败' };
            }
        } catch (error) {
            console.error('更新云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 设置默认云端配置
    async setDefaultCloudConfig(configId) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch(`/api/v1/user/configs/${configId}/default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.message || '设置默认配置失败' };
            }
        } catch (error) {
            console.error('设置默认配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 删除云端配置
    async deleteCloudConfig(configId) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch(`/api/v1/user/configs/${configId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.message || '删除云端配置失败' };
            }
        } catch (error) {
            console.error('删除云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 导出云端配置
    async exportCloudConfigs() {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch('/api/v1/user/configs/export', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result.message || '导出云端配置失败' };
            }
        } catch (error) {
            console.error('导出云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 导入云端配置
    async importCloudConfigs(importData) {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const response = await fetch('/api/v1/user/configs/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                },
                body: JSON.stringify(importData)
            });

            const result = await response.json();
            if (result.code === 200) {
                return { success: true, message: result.message };
            } else {
                return { success: false, error: result.message || '导入云端配置失败' };
            }
        } catch (error) {
            console.error('导入云端配置失败:', error);
            return { success: false, error: '网络连接失败' };
        }
    }

    // 同步本地配置到云端
    async syncLocalToCloud(configType = 'app_config') {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const localConfig = this.getLocalConfigByType(configType);
            if (!localConfig) {
                return { success: false, error: '没有找到本地配置' };
            }

            const cloudConfig = {
                configType: configType,
                configName: `${configType}_${new Date().toISOString().split('T')[0]}`,
                configContent: JSON.stringify(localConfig),
                isDefault: true,
                remark: '从本地同步'
            };

            // 先检查是否已有同类型的默认配置
            const existingConfigs = await this.getCloudConfigs(configType);
            if (existingConfigs.success && existingConfigs.data.length > 0) {
                const defaultConfig = existingConfigs.data.find(config => config.isDefault);
                if (defaultConfig) {
                    // 更新现有默认配置
                    return await this.updateCloudConfig(defaultConfig.id, {
                        ...cloudConfig,
                        configName: defaultConfig.configName
                    });
                }
            }

            // 创建新配置
            return await this.createCloudConfig(cloudConfig);
        } catch (error) {
            console.error('同步配置到云端失败:', error);
            return { success: false, error: '同步失败' };
        }
    }

    // 从云端同步配置到本地
    async syncCloudToLocal(configType = 'app_config') {
        if (!this.isBackendConfigValid()) {
            return { success: false, error: 'API Key未配置' };
        }

        try {
            const cloudConfigs = await this.getCloudConfigs(configType);
            if (!cloudConfigs.success || cloudConfigs.data.length === 0) {
                return { success: false, error: '云端没有找到配置' };
            }

            // 获取默认配置
            const defaultConfig = cloudConfigs.data.find(config => config.isDefault);
            if (!defaultConfig) {
                return { success: false, error: '云端没有默认配置' };
            }

            // 解析配置内容
            let localConfig;
            try {
                localConfig = JSON.parse(defaultConfig.configContent);
            } catch (parseError) {
                return { success: false, error: '云端配置格式错误' };
            }

            // 应用到本地
            this.applyConfigFromCloud(localConfig, configType);

            return {
                success: true,
                message: '云端配置同步成功',
                configName: defaultConfig.configName,
                updateTime: defaultConfig.updateTime
            };
        } catch (error) {
            console.error('从云端同步配置失败:', error);
            return { success: false, error: '同步失败' };
        }
    }

    // 根据类型获取本地配置
    getLocalConfigByType(configType) {
        switch (configType) {
            case 'app_config':
                return {
                    backendApiKey: this.config.backendApiKey,
                    useBackendMode: this.config.useBackendMode,
                    autoSaveConfig: this.config.autoSaveConfig,
                    theme: this.config.theme,
                    sendHistory: this.config.sendHistory
                };
            case 'theme_config':
                return {
                    theme: this.config.theme
                };
            case 'api_config':
                return {
                    backendApiKey: this.config.backendApiKey,
                    useBackendMode: this.config.useBackendMode
                };
            default:
                return this.getConfig();
        }
    }

    // 应用云端配置到本地
    applyConfigFromCloud(cloudConfig, configType) {
        if (configType === 'app_config' || !configType) {
            this.updateConfig(cloudConfig);
        } else {
            // 部分更新配置
            const updates = {};
            Object.keys(cloudConfig).forEach(key => {
                if (this.config.hasOwnProperty(key)) {
                    updates[key] = cloudConfig[key];
                }
            });
            if (Object.keys(updates).length > 0) {
                this.updateConfig(updates);
            }
        }
    }

    // 获取使用额度信息
    async getQuotaInfo() {
        if (!this.isBackendConfigValid()) {
            return null;
        }

        try {
            const response = await fetch('/api/v1/quota', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.backendApiKey
                }
            });

            if (response.ok) {
                const result = await response.json();
                return result.code === 200 ? result.data : null;
            }
            return null;
        } catch (error) {
            console.error('获取额度信息失败:', error);
            return null;
        }
    }

    // 重置配置
    resetConfig() {
        this.config = {
            backendApiKey: '',
            useBackendMode: false,
            autoSaveConfig: true,
            theme: 'light',
            sendHistory: false
        };
        this.backendMode = false;
        this.saveConfig();
    }

    // 获取当前配置
    getConfig() {
        return { ...this.config };
    }

    // 导出配置
    exportConfig() {
        return {
            ...this.config,
            exportTime: new Date().toISOString(),
            version: '1.0.0',
            mode: this.backendMode ? 'backend' : 'frontend'
        };
    }

    // 导入配置
    importConfig(importedConfig) {
        if (!importedConfig.backendApiKey) {
            throw new Error('无效的配置文件，缺少后端API Key');
        }

        // 验证并合并配置
        Object.assign(this.config, importedConfig);
        this.saveConfig();
        this.backendMode = this.config.useBackendMode;
        return true;
    }

    // 显示配置对话框
    showConfigDialog() {
        // 创建模态对话框
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">配置管理</h3>

            <!-- 标签页 -->
            <div style="border-bottom: 1px solid #ddd; margin-bottom: 20px;">
                <button id="localTab" class="tab-button active" style="padding: 10px 20px; border: none; background: #f8f9fa; border-bottom: 2px solid #007bff; cursor: pointer; margin-right: 10px;">
                    本地配置
                </button>
                <button id="cloudTab" class="tab-button" style="padding: 10px 20px; border: none; background: transparent; cursor: pointer; margin-right: 10px;">
                    云端配置
                </button>
            </div>

            <!-- 本地配置面板 -->
            <div id="localPanel" class="config-panel">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">API Key:</label>
                    <input type="password" id="apiKeyInput" value="${this.config.backendApiKey}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                           placeholder="请输入后端API Key">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="useBackendMode" ${this.config.useBackendMode ? 'checked' : ''}
                               style="margin-right: 8px;">
                        使用后端模式（集成版）
                    </label>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="autoSaveConfig" ${this.config.autoSaveConfig ? 'checked' : ''}
                               style="margin-right: 8px;">
                        自动保存配置
                    </label>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="sendHistory" ${this.config.sendHistory ? 'checked' : ''}
                               style="margin-right: 8px;">
                        发送使用历史
                    </label>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">主题:</label>
                    <select id="themeSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="light" ${this.config.theme === 'light' ? 'selected' : ''}>浅色主题</option>
                        <option value="dark" ${this.config.theme === 'dark' ? 'selected' : ''}>深色主题</option>
                    </select>
                </div>
                <div style="margin-bottom: 20px;">
                    <button id="testConnectionBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        测试连接
                    </button>
                    <button id="queryQuotaBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        查询额度
                    </button>
                    <span id="statusMessage" style="color: #666;"></span>
                </div>
                <div style="margin-bottom: 20px;">
                    <button id="exportLocalBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">
                        导出本地配置
                    </button>
                    <button id="importLocalBtn" style="padding: 8px 16px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        导入本地配置
                    </button>
                    <input type="file" id="importFile" accept=".json" style="display: none;">
                </div>
            </div>

            <!-- 云端配置面板 -->
            <div id="cloudPanel" class="config-panel" style="display: none;">
                <div style="margin-bottom: 20px;">
                    <button id="refreshCloudBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        刷新云端配置
                    </button>
                    <button id="syncToCloudBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        同步到云端
                    </button>
                    <button id="syncFromCloudBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        从云端同步
                    </button>
                </div>
                <div id="cloudConfigList" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px;">
                    <p style="color: #666; text-align: center;">点击"刷新云端配置"获取云端配置列表</p>
                </div>
                <div style="margin-top: 20px;">
                    <button id="exportCloudBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">
                        导出云端配置
                    </button>
                    <button id="importCloudBtn" style="padding: 8px 16px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        导入云端配置
                    </button>
                </div>
            </div>

            <div style="text-align: right; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
                <button id="cancelBtn" style="padding: 8px 16px; margin-right: 10px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    取消
                </button>
                <button id="saveBtn" style="padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    保存本地配置
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // 绑定事件
        const testBtn = dialog.querySelector('#testConnectionBtn');
        const queryBtn = dialog.querySelector('#queryQuotaBtn');
        const saveBtn = dialog.querySelector('#saveBtn');
        const cancelBtn = dialog.querySelector('#cancelBtn');
        const statusMsg = dialog.querySelector('#statusMessage');

        // 标签页切换
        const localTab = dialog.querySelector('#localTab');
        const cloudTab = dialog.querySelector('#cloudTab');
        const localPanel = dialog.querySelector('#localPanel');
        const cloudPanel = dialog.querySelector('#cloudPanel');

        const switchTab = (activeTab, activePanel, inactiveTab, inactivePanel) => {
            activeTab.style.background = '#f8f9fa';
            activeTab.style.borderBottom = '2px solid #007bff';
            inactiveTab.style.background = 'transparent';
            inactiveTab.style.borderBottom = 'none';
            activePanel.style.display = 'block';
            inactivePanel.style.display = 'none';
        };

        localTab.addEventListener('click', () => {
            switchTab(localTab, localPanel, cloudTab, cloudPanel);
        });

        cloudTab.addEventListener('click', () => {
            switchTab(cloudTab, cloudPanel, localTab, localPanel);
            // 切换到云端面板时自动刷新配置列表
            this.loadCloudConfigList(dialog);
        });

        // 本地配置事件
        testBtn.addEventListener('click', async () => {
            const apiKey = dialog.querySelector('#apiKeyInput').value;
            if (!apiKey) {
                statusMsg.textContent = '请先输入API Key';
                statusMsg.style.color = 'red';
                return;
            }

            statusMsg.textContent = '正在测试连接...';
            statusMsg.style.color = '#666';

            const originalKey = this.config.backendApiKey;
            this.config.backendApiKey = apiKey;
            const result = await this.testBackendConnection();
            this.config.backendApiKey = originalKey;

            if (result.success) {
                statusMsg.textContent = '✅ ' + result.message;
                statusMsg.style.color = 'green';
            } else {
                statusMsg.textContent = '❌ ' + result.error;
                statusMsg.style.color = 'red';
            }
        });

        queryBtn.addEventListener('click', async () => {
            const apiKey = dialog.querySelector('#apiKeyInput').value;
            if (!apiKey) {
                statusMsg.textContent = '请先输入API Key';
                statusMsg.style.color = 'red';
                return;
            }

            statusMsg.textContent = '正在查询额度...';
            statusMsg.style.color = '#666';

            const originalKey = this.config.backendApiKey;
            this.config.backendApiKey = apiKey;
            const quotaInfo = await this.getQuotaInfo();
            this.config.backendApiKey = originalKey;

            if (quotaInfo) {
                statusMsg.textContent = `剩余额度: ${quotaInfo.remainingQuota || 'N/A'}`;
                statusMsg.style.color = 'green';
            } else {
                statusMsg.textContent = '❌ 查询额度失败';
                statusMsg.style.color = 'red';
            }
        });

        // 导入导出本地配置
        dialog.querySelector('#exportLocalBtn').addEventListener('click', () => {
            const configData = this.exportConfig();
            const dataStr = JSON.stringify(configData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `aiprompt2draw-config-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        });

        dialog.querySelector('#importLocalBtn').addEventListener('click', () => {
            dialog.querySelector('#importFile').click();
        });

        dialog.querySelector('#importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedConfig = JSON.parse(event.target.result);
                    this.importConfig(importedConfig);

                    // 更新对话框中的值
                    dialog.querySelector('#apiKeyInput').value = this.config.backendApiKey;
                    dialog.querySelector('#useBackendMode').checked = this.config.useBackendMode;
                    dialog.querySelector('#autoSaveConfig').checked = this.config.autoSaveConfig;
                    dialog.querySelector('#sendHistory').checked = this.config.sendHistory;
                    dialog.querySelector('#themeSelect').value = this.config.theme;

                    alert('本地配置导入成功');
                } catch (error) {
                    alert('导入失败：' + error.message);
                }
            };
            reader.readAsText(file);
        });

        // 云端配置事件
        dialog.querySelector('#refreshCloudBtn').addEventListener('click', () => {
            this.loadCloudConfigList(dialog);
        });

        dialog.querySelector('#syncToCloudBtn').addEventListener('click', async () => {
            if (!confirm('确定要将当前本地配置同步到云端吗？这将覆盖云端的默认配置。')) {
                return;
            }

            const result = await this.syncLocalToCloud();
            if (result.success) {
                alert('✅ 配置同步到云端成功');
                this.loadCloudConfigList(dialog);
            } else {
                alert('❌ 同步失败：' + result.error);
            }
        });

        dialog.querySelector('#syncFromCloudBtn').addEventListener('click', async () => {
            if (!confirm('确定要从云端同步配置吗？这将覆盖当前的本地配置。')) {
                return;
            }

            const result = await this.syncCloudToLocal();
            if (result.success) {
                alert('✅ 云端配置同步成功：' + result.configName);
                // 更新对话框中的值
                dialog.querySelector('#apiKeyInput').value = this.config.backendApiKey;
                dialog.querySelector('#useBackendMode').checked = this.config.useBackendMode;
                dialog.querySelector('#autoSaveConfig').checked = this.config.autoSaveConfig;
                dialog.querySelector('#sendHistory').checked = this.config.sendHistory;
                dialog.querySelector('#themeSelect').value = this.config.theme;
            } else {
                alert('❌ 同步失败：' + result.error);
            }
        });

        dialog.querySelector('#exportCloudBtn').addEventListener('click', async () => {
            const result = await this.exportCloudConfigs();
            if (result.success) {
                const dataStr = JSON.stringify(result.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `aiprompt2draw-cloud-configs-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                alert('导出云端配置失败：' + result.error);
            }
        });

        dialog.querySelector('#importCloudBtn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const importData = JSON.parse(event.target.result);
                        const result = await this.importCloudConfigs(importData);
                        if (result.success) {
                            alert('✅ ' + result.message);
                            this.loadCloudConfigList(dialog);
                        } else {
                            alert('❌ 导入失败：' + result.error);
                        }
                    } catch (error) {
                        alert('导入失败：' + error.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        saveBtn.addEventListener('click', () => {
            const apiKey = dialog.querySelector('#apiKeyInput').value;
            const useBackendMode = dialog.querySelector('#useBackendMode').checked;
            const autoSaveConfig = dialog.querySelector('#autoSaveConfig').checked;
            const sendHistory = dialog.querySelector('#sendHistory').checked;
            const theme = dialog.querySelector('#themeSelect').value;

            this.setBackendApiKey(apiKey);
            this.setBackendMode(useBackendMode);
            this.updateConfig({
                autoSaveConfig,
                sendHistory,
                theme
            });

            document.body.removeChild(modal);

            if (window.uiManager) {
                window.uiManager.addMessage('system', '✅ 本地配置已保存');
            }
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 加载云端配置列表
    async loadCloudConfigList(dialog) {
        const listContainer = dialog.querySelector('#cloudConfigList');
        listContainer.innerHTML = '<p style="color: #666; text-align: center;">正在加载云端配置...</p>';

        const result = await this.getCloudConfigs();
        if (result.success && result.data.length > 0) {
            let html = '';
            result.data.forEach(config => {
                const defaultBadge = config.isDefault ? '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">默认</span>' : '';
                const updateTime = config.updateTime ? new Date(config.updateTime).toLocaleString() : '未知';

                html += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${config.configName}</strong> ${defaultBadge}
                                <br>
                                <small style="color: #666;">类型: ${config.configType} | 更新: ${updateTime}</small>
                                ${config.remark ? '<br><small style="color: #999;">' + config.remark + '</small>' : ''}
                            </div>
                            <div>
                                ${!config.isDefault ? `<button onclick="backendConfigManager.setDefaultCloudConfig(${config.id}).then(() => backendConfigManager.loadCloudConfigList(document.querySelector('#cloudConfigList').closest('[style*=fixed]')))" style="padding: 4px 8px; margin-right: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">设为默认</button>` : ''}
                                <button onclick="backendConfigManager.deleteCloudConfig(${config.id}).then(() => backendConfigManager.loadCloudConfigList(document.querySelector('#cloudConfigList').closest('[style*=fixed]')))" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">删除</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            listContainer.innerHTML = html || '<p style="color: #666; text-align: center;">暂无云端配置</p>';
        } else {
            listContainer.innerHTML = '<p style="color: #666; text-align: center;">' + (result.error || '暂无云端配置') + '</p>';
        }
    }
}

// 创建全局配置实例
const backendConfigManager = new BackendConfigManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackendConfigManager, backendConfigManager };
} else {
    window.BackendConfigManager = BackendConfigManager;
    window.backendConfigManager = backendConfigManager;
}