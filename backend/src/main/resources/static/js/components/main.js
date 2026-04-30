/**
 * 主界面组件
 * 集成AI配置、聊天管理和DrawIO服务模块
 */

class MainComponent extends BaseComponent {
    /**
     * 构造函数
     */
    constructor() {
        super();
        this.sidebarCollapsed = false;
        this.activeSection = 'flowchart';
        this.isLoading = false;
        this.userMenuOpen = false;
        this.currentMode = 'frontend'; // 'frontend' 或 'backend'

        // 初始化服务管理器
        this.aiConfigService = window.aiConfigService;
        this.chatManager = window.chatManager;
        this.drawioManager = window.drawioManager;
        this.chatService = window.chatService;
        this.quotaService = window.quotaService;

        // 对话历史
        this.conversationHistory = [];
        this.isThinking = false;
    }

    /**
     * 初始化状态
     */
    initState() {
        this.state = {
            user: window.authManager?.getCurrentUser() || null,
            config: this.aiConfigService?.getConfig() || {},
            conversationHistory: [],
            isThinking: false,
            drawioReady: false,
            currentMode: this.currentMode
        };
    }

    /**
     * 执行渲染
     */
    async doRender(container) {
        container.innerHTML = this.getMainHTML();

        // 绑定事件
        this.bindEvents();

        // 初始化DrawIO
        await this.initializeDrawIO();

        // 从后端加载配置（如果可能）
        await this.loadConfigFromBackend();

        // 初始化设置
        this.initializeSettings();

        // 更新API状态
        this.updateApiStatus();

        // 初始化配额显示
        this.initializeQuotaDisplay();

        // 设置历史记录开关状态
        const historyToggle = document.getElementById('historyToggle');
        if (historyToggle) {
            historyToggle.checked = this.aiConfigService?.getConfig('sendHistory') !== false;
        }

        // 绑定服务事件
        this.bindServiceEvents();
    }

    /**
     * 从后端加载配置
     */
    async loadConfigFromBackend() {
        if (this.aiConfigService) {
            try {
                await this.aiConfigService.loadFromBackend();
            } catch (error) {
                this.logDebug('从后端加载配置失败，使用本地配置', error);
            }
        }
    }

    /**
     * 初始化配额显示
     */
    initializeQuotaDisplay() {
        if (this.quotaService) {
            // 初始化配额显示
            const quotaData = this.quotaService.getQuotaSummary();
            this.updateQuotaDisplay(quotaData);

            // 尝试刷新配额信息
            this.quotaService.refreshQuota(true).catch(error => {
                this.logDebug('初始化配额刷新失败', error);
            });
        }
    }

    /**
     * 绑定服务事件
     */
    bindServiceEvents() {
        // AI配置服务事件
        if (this.aiConfigService) {
            this.aiConfigService.addEventListener('configChanged', (e) => {
                this.state.config = e.detail;
                this.updateApiStatus();
            });

            this.aiConfigService.addEventListener('providerChanged', (e) => {
                this.populateProviderUI(true);
            });
        }

        // 聊天管理器事件
        if (this.chatManager) {
            this.chatManager.addEventListener('messageAdded', (e) => {
                this.conversationHistory.push(e.detail);
            });

            this.chatManager.addEventListener('xmlLoadRequested', (e) => {
                this.loadXMLToDrawio(e.detail.xml);
            });
        }

        // 聊天服务事件
        if (this.chatService) {
            this.chatService.addEventListener('messageSending', (e) => {
                this.logDebug('开始发送消息', e.detail);
            });

            this.chatService.addEventListener('messageSent', (e) => {
                this.logDebug('消息发送完成', e.detail);
                const { result } = e.detail;
                if (result.success && result.xml) {
                    this.loadXMLToDrawio(result.xml);
                }
            });

            this.chatService.addEventListener('messageError', (e) => {
                this.logError('消息发送失败', e.detail.error);
                this.chatManager?.addMessage('system', '❌ 错误：' + e.detail.error.message);
            });
        }

        // 配额服务事件
        if (this.quotaService) {
            this.quotaService.addEventListener('quotaUpdated', (e) => {
                this.updateQuotaDisplay(e.detail);
            });

            this.quotaService.addEventListener('quotaWarning', (e) => {
                this.showQuotaWarning('warning', e.detail);
            });

            this.quotaService.addEventListener('quotaCritical', (e) => {
                this.showQuotaWarning('critical', e.detail);
            });

            this.quotaService.addEventListener('quotaInsufficient', (e) => {
                this.showQuotaWarning('insufficient', e.detail);
            });
        }

        // DrawIO管理器事件
        if (this.drawioManager) {
            this.drawioManager.addEventListener('ready', () => {
                this.state.drawioReady = true;
            });

            this.drawioManager.addEventListener('xmlExported', (e) => {
                this.logDebug('DrawIO XML导出', e.detail);
            });
        }
    }

    /**
     * 获取主界面HTML
     */
    getMainHTML() {
        const user = this.state.user;
        const isAdmin = window.authManager?.isAdmin() || false;

        return `
            <div class="container">
                <div class="left-panel">
                    <div class="header">
                        <div class="header-left">
                            <h1>
                                <img src="assets/images/Prompt2Draw-w.png" alt="icon" style="height: 32px; width: 32px;">
                                一语成图 (Prompt2Draw)
                            </h1>
                        </div>
                        <div class="header-actions">
                            <div class="api-status" id="apiStatus">
                                <span class="status-dot"></span>
                                <span>未配置</span>
                            </div>
                            <div class="quota-status" id="quotaStatus" title="配额信息">
                                <span class="quota-icon">💎</span>
                                <span class="quota-text">--</span>
                            </div>
                            <button class="settings-btn" id="modeToggleBtn" onclick="window.mainComponent.toggleMode()" title="切换模式">
                                🔄 前端模式
                            </button>
                            <button class="settings-btn" onclick="window.mainComponent.testDrawIO()" title="测试DrawIO">
                                🧪 测试
                            </button>
                            <button class="settings-btn" onclick="window.mainComponent.openSettings()" title="设置">
                                ⚙️ 设置
                            </button>
                            ${isAdmin ? `
                                <button class="settings-btn" onclick="window.router.navigate('${AppConfig.ROUTES.ADMIN}')" title="管理后台">
                                    🛠️ 管理
                                </button>
                            ` : ''}
                            <button class="settings-btn" onclick="window.router.navigate('${AppConfig.ROUTES.PROFILE}')" title="个人中心">
                                👤 个人中心
                            </button>
                            <button class="settings-btn" onclick="window.mainComponent.logout()" title="退出登录">
                                🚪 退出
                            </button>
                            <button class="theme-toggle-btn" id="themeToggleBtn" onclick="window.app?.toggleTheme()" title="切换主题">🌙</button>
                        </div>
                    </div>
                    <div class="drawio-container">
                        <div id="drawioPlaceholder" class="drawio-placeholder">
                            请在右侧输入你的需求，要做什么，<br>得到结果后点击加载即可显示。
                        </div>
                        <iframe id="drawioFrame" src="https://embed.diagrams.net/?embed=1&proto=json&libraries=1&noSaveBtn=1&saveAndExit=0"></iframe>
                    </div>
                </div>

                <div class="right-panel">
                    <div class="chat-card">
                        <div class="chat-header">
                            <h2>🎨 AI 成图助手</h2>
                            <div class="chat-header-actions" style="display: flex; gap: 8px;">
                                <button class="help-btn" id="newChatBtn" onclick="window.mainComponent.newChat()" title="新建对话">🆕</button>
                                <button class="help-btn" onclick="window.mainComponent.openTips()" title="查看帮助">💡</button>
                            </div>
                        </div>
                        <div class="chat-messages" id="chatMessages">
                            <div class="message assistant">
                                <div class="message-content">
                                    👋 你好！我是你的AI助手。描述你想要创建的流程图，我会帮你生成！
                                    <br><br>
                                    <strong>📝 使用步骤：</strong>
                                    <br>1. 点击右上角 ⚙️ 配置API密钥
                                    <br>2. 描述你想要的流程图内容
                                    <br>3. AI生成后将自动加载到左侧
                                    <br>4. 或点击 📋 复制XML（手动导入）
                                    <br><br>
                                    <small>💡 提示：点击我上方的 💡 按钮可查看更多帮助和示例模板！</small>
                                </div>
                            </div>
                        </div>
                        <div class="chat-input-container">
                            <div class="form-group" style="margin-bottom: 2px; padding-bottom: 2px; border-bottom: 1px solid #f0f0f0;">
                                <div class="switch-group">
                                    <div>
                                        <label style="margin-bottom: 0; font-size: 14px;">携带历史对话</label>
                                        <small style="margin-top: 0px; font-size: 12px; line-height: 1.3;">关闭后可节省Tokens</small>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="historyToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div class="chat-input-wrapper">
                                <textarea
                                    id="chatInput"
                                    class="chat-input"
                                    placeholder="描述你想要的流程图内容.."
                                    rows="1"
                                ></textarea>
                                <button class="send-btn" id="sendBtn" onclick="window.mainComponent.sendMessage()">
                                    发送
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" id="importFile" accept=".json" style="display:none;" onchange="window.mainComponent.handleFileImport(event)">

            <!-- 设置模态框 -->
            <div class="modal-overlay" id="settingsModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>⚙️ API配置</h3>
                        <button class="modal-close" onclick="window.mainComponent.closeSettings()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>API 服务商</label>
                            <select id="providerSelect" onchange="window.mainComponent.populateProviderUI(true)">
                                <option value="siliconflow">硅基流动 (Siliconflow)</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="kimi">Kimi (Moonshot)</option>
                                <option value="zhipu">智谱 GLM (Zhipu)</option>
                                <option value="longcat">LongCat</option>
                                <option value="xiaomi">小米 MiMo</option>
                                <option value="minimax">MiniMax</option>
                                <option value="modelscope">魔搭 (ModelScope)</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>API Key *</label>
                            <input type="password" id="apiKeyInput" placeholder="请输入所选服务商的 API Key">
                            <small>请确保 API Key 与上方选择的服务商匹配</small>
                        </div>

                        <div class="form-group">
                            <label>API 地址</label>
                            <input type="text" id="apiUrlInput" value="https://api.siliconflow.cn/v1/chat/completions" placeholder="API地址">
                            <small>选择服务商可自动填充，自定义时可手动修改</small>
                        </div>

                        <div class="form-group">
                            <label>模型选择</label>
                            <select id="modelSelect">
                            </select>
                            <small>选择适合的AI模型生成流程图</small>
                        </div>

                        <div class="form-group">
                            <div class="switch-group">
                                <div>
                                    <label style="margin-bottom: 0;">流式输出</label>
                                    <small style="margin-top: 4px;">实时显示生成内容</small>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="streamToggle" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.mainComponent.importSettings()" style="margin-right: auto;">导入配置</button>
                        <button class="btn btn-secondary" onclick="window.mainComponent.exportSettings()">导出配置</button>
                        <button class="btn btn-secondary" onclick="window.mainComponent.closeSettings()">取消</button>
                        <button class="btn btn-primary" onclick="window.mainComponent.saveSettings()">保存配置</button>
                    </div>
                </div>
            </div>

            <!-- 帮助模态框 -->
            <div class="modal-overlay" id="tipsModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>💡 使用说明</h3>
                        <button class="modal-close" onclick="window.mainComponent.closeTips()">×</button>
                    </div>
                    <div class="modal-body" style="padding-top: 16px;">
                        <ol>
                            <li>点击右上角 ⚙️ 设置配置API</li>
                            <li>输入流程图描述，AI将生成XML</li>
                            <li>AI生成后将**自动加载**到左侧编辑器</li>
                            <li>如自动加载失败，可点击 📋 复制XML"手动导入</li>
                        </ol>
                        <strong>✨ 示例模板</strong>
                        <div class="example-prompts">
                            <span class="example-prompt" onclick="window.mainComponent.fillExample('创建一个电商订单处理流程图，包括下单、支付、发货、收货等节点')">📦 订单流程</span>
                            <span class="example-prompt" onclick="window.mainComponent.fillExample('生成一个用户登录验证流程图')">👤 登录流程</span>
                            <span class="example-prompt" onclick="window.mainComponent.fillExample('画一个请假审批流程?')">📄 请假流程</span>
                            <span class="example-prompt" onclick="window.mainComponent.fillExample('设计一个退款处理流程?')">💰 退款流程</span>
                        </div>
                    </div>
                    <div class="modal-footer" style="justify-content: center;">
                         <button class="btn btn-primary" id="tipsCloseBtn" onclick="window.mainComponent.closeTips()">我明白了</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 聊天输入框事件
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('input', () => this.handleChatInput());
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // 历史记录开关
        const historyToggle = document.getElementById('historyToggle');
        if (historyToggle) {
            historyToggle.addEventListener('change', async () => {
                await this.aiConfigService?.setConfig('sendHistory', historyToggle.checked);
            });
        }

        // 设置模态框事件
        this.bindSettingsEvents();

        // 帮助模态框事件
        this.bindTipsEvents();
    }

    /**
     * 处理聊天输入
     */
    handleChatInput() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        }
    }

    /**
     * 初始化DrawIO
     */
    async initializeDrawIO() {
        if (this.drawioManager) {
            await this.drawioManager.initializeFrame();
        }
    }

    /**
     * 初始化设置
     */
    initializeSettings() {
        this.populateProviderUI(false);
    }

    /**
     * 更新API状态显示
     */
    updateApiStatus() {
        const statusElement = document.getElementById('apiStatus');
        if (!statusElement || !this.aiConfigService) return;

        const currentProvider = this.aiConfigService.getConfig('provider');
        const hasApiKey = this.aiConfigService.hasCurrentApiKey();

        if (hasApiKey) {
            statusElement.innerHTML = `<span class="status-dot"></span><span>${currentProvider} Key已配置</span>`;
        } else {
            statusElement.innerHTML = `<span class="status-dot" style="background: #f44336;"></span><span>Key未配置</span>`;
        }
    }

    /**
     * 切换模式（前端/后端）
     */
    toggleMode() {
        this.currentMode = this.currentMode === 'frontend' ? 'backend' : 'frontend';
        const modeBtn = document.getElementById('modeToggleBtn');
        if (modeBtn) {
            modeBtn.innerHTML = `🔄 ${this.currentMode === 'frontend' ? '前端模式' : '后端模式'}`;
        }
        this.logInfo('切换模式', { mode: this.currentMode });
    }

    /**
     * 发送消息
     */
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // 检查API配置
        if (!this.aiConfigService?.hasCurrentApiKey()) {
            const currentProvider = this.aiConfigService?.getConfig('provider') || '未知';
            this.chatManager?.addMessage('system', `⚠️ 请先点击右上角设置按钮，为 [${currentProvider}] 配置API Key`);
            return;
        }

        // 添加用户消息
        this.chatManager?.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // 添加思考消息
        this.chatManager?.addThinkingMessage();
        this.isThinking = true;

        // 禁用发送按钮
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="loading"></span>';
        }

        try {
            // 使用聊天服务发送消息
            const result = await this.chatService?.sendMessage(message, {
                useBackend: this.currentMode === 'backend',
                stream: this.aiConfigService?.getConfig('stream'),
                sendHistory: this.aiConfigService?.getConfig('sendHistory')
            });

            // 移除思考消息
            this.chatManager?.removeThinkingMessage();
            this.isThinking = false;

            // 添加AI响应消息
            if (result?.success) {
                this.chatManager?.addMessage('assistant', result.content, result.xml, result.usage);
            }

        } catch (error) {
            this.chatManager?.removeThinkingMessage();
            this.isThinking = false;
            // 错误处理已在聊天服务的事件监听器中处理
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.textContent = '发送';
            }
        }
    }

    
    /**
     * 加载XML到DrawIO
     */
    loadXMLToDrawio(xml) {
        if (this.drawioManager) {
            this.drawioManager.loadXml(xml);
        }
    }

    /**
     * 新建对话
     */
    newChat() {
        this.chatManager?.clearMessages();
        this.conversationHistory = [];
        this.chatService?.clearHistory();
        this.logInfo('新建对话');
    }

    /**
     * 打开设置
     */
    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    /**
     * 关闭设置
     */
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * 打开帮助
     */
    openTips() {
        const modal = document.getElementById('tipsModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    /**
     * 关闭帮助
     */
    closeTips() {
        const modal = document.getElementById('tipsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * 填充示例
     */
    fillExample(text) {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = text;
            this.handleChatInput();
        }
        this.closeTips();
    }

    /**
     * 填充服务商UI
     */
    populateProviderUI(clearApiKey = false) {
        if (!this.aiConfigService) return;

        const provider = document.getElementById('providerSelect')?.value;
        const apiUrlInput = document.getElementById('apiUrlInput');
        const modelSelect = document.getElementById('modelSelect');
        const apiKeyInput = document.getElementById('apiKeyInput');

        if (provider && apiUrlInput && modelSelect) {
            const preset = this.aiConfigService.getProviderPreset(provider);
            if (preset) {
                apiUrlInput.value = preset.apiUrl;

                // 填充模型选项
                modelSelect.innerHTML = '';
                preset.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });

                // 设置当前模型
                const currentModel = this.aiConfigService.getConfig('model');
                if (currentModel && preset.models.includes(currentModel)) {
                    modelSelect.value = currentModel;
                }
            }

            // 清空API Key（如果需要）
            if (clearApiKey && apiKeyInput) {
                apiKeyInput.value = '';
            }
        }
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        if (!this.aiConfigService) return;

        const provider = document.getElementById('providerSelect')?.value;
        const apiKey = document.getElementById('apiKeyInput')?.value;
        const apiUrl = document.getElementById('apiUrlInput')?.value;
        const model = document.getElementById('modelSelect')?.value;
        const stream = document.getElementById('streamToggle')?.checked;

        try {
            // 更新配置
            this.aiConfigService.setProvider(provider);
            if (apiKey) {
                this.aiConfigService.setApiKey(provider, apiKey);
            }
            await this.aiConfigService.setConfig({
                apiUrl: apiUrl,
                model: model,
                stream: stream
            });

            this.closeSettings();
            this.logInfo('配置已保存');
        } catch (error) {
            this.logError('保存配置失败', error);
        }
    }

    /**
     * 导出设置
     */
    exportSettings() {
        if (!this.aiConfigService) return;

        const configJson = this.aiConfigService.exportConfig();
        if (configJson) {
            const blob = new Blob([configJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai-config.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    /**
     * 导入设置
     */
    importSettings() {
        const input = document.getElementById('importFile');
        if (input) {
            input.click();
        }
    }

    /**
     * 处理文件导入
     */
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file || !this.aiConfigService) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = this.aiConfigService.importConfig(e.target.result);
                if (success) {
                    this.populateProviderUI(false);
                    this.logInfo('配置导入成功');
                } else {
                    this.logError('配置导入失败');
                }
            } catch (error) {
                this.logError('配置导入失败', error);
            }
        };
        reader.readAsText(file);
    }

    /**
     * 测试DrawIO
     */
    testDrawIO() {
        const testXml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0" value="测试节点"/></root></mxGraphModel>`;
        this.loadXMLToDrawio(testXml);
        this.logInfo('DrawIO测试');
    }

    /**
     * 退出登录
     */
    async logout() {
        try {
            await window.authManager?.logout();
        } catch (error) {
            this.logError('退出登录失败', error);
        }
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 设置模态框背景点击关闭
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }
    }

    /**
     * 绑定帮助事件
     */
    bindTipsEvents() {
        // 帮助模态框背景点击关闭
        const tipsModal = document.getElementById('tipsModal');
        if (tipsModal) {
            tipsModal.addEventListener('click', (e) => {
                if (e.target === tipsModal) {
                    this.closeTips();
                }
            });
        }
    }

    /**
     * 更新配额显示
     * @param {object} quotaData - 配额数据
     */
    updateQuotaDisplay(quotaData) {
        const quotaStatus = document.getElementById('quotaStatus');
        if (!quotaStatus) return;

        const summary = this.quotaService?.getQuotaSummary();
        if (!summary) return;

        const quotaText = quotaStatus.querySelector('.quota-text');
        const quotaIcon = quotaStatus.querySelector('.quota-icon');

        if (summary.hasQuota) {
            // 显示剩余配额
            const remainingText = this.quotaService.formatQuota(summary.remainingQuota);
            const totalText = this.quotaService.formatQuota(summary.totalQuota);
            quotaText.textContent = `${remainingText}/${totalText}`;

            // 根据状态设置样式
            quotaStatus.className = `quota-status quota-${summary.status}`;

            // 根据状态设置图标
            switch (summary.status) {
                case 'exceeded':
                    quotaIcon.textContent = '⛔';
                    break;
                case 'critical':
                    quotaIcon.textContent = '⚠️';
                    break;
                case 'warning':
                    quotaIcon.textContent = '⚡';
                    break;
                default:
                    quotaIcon.textContent = '💎';
            }
        } else {
            quotaText.textContent = '无限制';
            quotaStatus.className = 'quota-status quota-unlimited';
            quotaIcon.textContent = '♾️';
        }

        // 更新工具提示
        const lastUpdated = summary.lastUpdated ? new Date(summary.lastUpdated).toLocaleString() : '未知';
        quotaStatus.title = `配额信息\n剩余: ${summary.remainingQuota}\n已用: ${summary.usedQuota}\n总计: ${summary.totalQuota}\n最后更新: ${lastUpdated}`;
    }

    /**
     * 显示配额警告
     * @param {string} type - 警告类型 ('warning', 'critical', 'insufficient')
     * @param {object} data - 配额数据
     */
    showQuotaWarning(type, data) {
        let message = '';
        let className = '';

        switch (type) {
            case 'warning':
                message = `⚡ 配额提醒：您还剩余 ${this.quotaService.formatQuota(data.remaining)} 次生成机会`;
                className = 'quota-warning';
                break;
            case 'critical':
                message = `⚠️ 配额不足：仅剩余 ${this.quotaService.formatQuota(data.remaining)} 次生成机会`;
                className = 'quota-critical';
                break;
            case 'insufficient':
                message = `⛔ 配额不足：需要 ${data.required} 次生成机会，但仅剩余 ${this.quotaService.formatQuota(data.available)} 次`;
                className = 'quota-insufficient';
                break;
        }

        if (message) {
            this.chatManager?.addMessage('system', message, null, null, className);
        }
    }
}

// 创建主界面组件实例
window.mainComponent = new MainComponent();
window.mainComponent.init(); // 确保组件被正确初始化

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainComponent;
}
