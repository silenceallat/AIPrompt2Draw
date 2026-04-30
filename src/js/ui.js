/**
 * AIPrompt2Draw - UI交互模块
 * 负责用户界面的交互、消息显示、主题切换等功能
 */

class UIManager {
    constructor() {
        this.conversationHistory = [];
        this.samplePrompts = null;
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.loadSamplePrompts();
    }

    // 加载示例模板
    async loadSamplePrompts() {
        try {
            const response = await fetch('assets/examples/sample-prompts.json');
            if (response.ok) {
                this.samplePrompts = await response.json();
            }
        } catch (e) {
            console.warn('加载示例模板失败:', e);
        }
    }

    // 初始化DOM元素引用
    initializeElements() {
        // 聊天相关
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.historyToggle = document.getElementById('historyToggle');

        // 模态框相关
        this.settingsModal = document.getElementById('settingsModal');
        this.tipsModal = document.getElementById('tipsModal');
        this.importFile = document.getElementById('importFile');

        // 其他
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.apiStatus = document.getElementById('apiStatus');
        this.newChatBtn = document.getElementById('newChatBtn');
    }

    // 绑定事件监听器
    bindEvents() {
        // 输入框事件
        if (this.chatInput) {
            this.chatInput.addEventListener('input', this.handleTextareaResize.bind(this));
            this.chatInput.addEventListener('keydown', this.handleKeydown.bind(this));
        }

        // 发送按钮
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        // 历史记录开关
        if (this.historyToggle) {
            this.historyToggle.addEventListener('change', this.handleHistoryToggle.bind(this));
        }

        // 模态框事件
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', this.handleModalClick.bind(this));
        }
        if (this.tipsModal) {
            this.tipsModal.addEventListener('click', this.handleModalClick.bind(this));
        }

        // 主题切换
        if (this.themeToggleBtn && !this.themeToggleBtn.getAttribute('onclick')) {
            this.themeToggleBtn.addEventListener('click', this.toggleTheme.bind(this));
        }

        // 新建对话
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', this.newChat.bind(this));
        }
    }

    // 处理文本域自动调整高度
    handleTextareaResize() {
        const textarea = this.chatInput;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    // 处理键盘事件
    handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSendMessage();
        }
    }

    // 处理历史记录开关
    handleHistoryToggle() {
        const isEnabled = this.historyToggle.checked;
        window.configManager.updateConfig({ sendHistory: isEnabled });
    }

    // 处理发送消息
    handleSendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // 检查API配置
        const config = window.configManager.getConfig();
        if (!config.apiKeys[config.provider]) {
            this.addMessage('system', `⚠️ 请先点击右上角设置按钮，为 [${config.provider}] 配置API Key`);
            return;
        }

        // 添加用户消息
        this.addMessage('user', message);

        // 清空输入框
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        // 添加到历史记录
        this.conversationHistory.push({ role: 'user', content: message });

        // 禁用发送按钮
        this.setSendButtonState(true);

        // 触发消息发送事件
        this.onSendMessage(message);
    }

    // 消息发送回调（需要在外部实现）
    onSendMessage(message) {
        // 这个方法会被外部覆盖
        console.log('发送消息:', message);
    }

    // 设置发送按钮状态
    setSendButtonState(loading) {
        if (this.sendBtn) {
            this.sendBtn.disabled = loading;
            this.sendBtn.innerHTML = loading ? '<span class="loading"></span>' : '发送';
        }
    }

    // 添加消息到聊天区域
    addMessage(role, content, xml = null, usage = null) {
        if (!this.chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        let xmlId = null;
        let messageHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;

        if (xml) {
            xmlId = 'xml_' + Date.now();
            messageHTML += this.createXMLSection(xmlId, xml);
        }

        if (usage) {
            messageHTML += this.createUsageSection(usage);
        }

        messageDiv.innerHTML = messageHTML;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return xmlId;
    }

    // 添加流式消息
    addStreamingMessage(messageId) {
        if (!this.chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.id = messageId;
        messageDiv.innerHTML = '<div class="message-content"></div>';

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // 更新流式消息内容
    updateStreamingMessage(messageId, content) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            const displayContent = content.replace(/```xml\n[\s\S]*?```/, '').trim();
            contentDiv.innerHTML = this.escapeHtml(displayContent);
            this.scrollToBottom();
        }
    }

    // 为流式消息添加XML操作按钮
    addLoadButton(messageId, xml, usage = null) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const contentDiv = messageDiv.querySelector('.message-content');
        const xmlId = 'xml_' + Date.now();

        contentDiv.innerHTML += this.createXMLSection(xmlId, xml);

        if (usage) {
            contentDiv.innerHTML += this.createUsageSection(usage);
        }

        // 自动加载到DrawIO
        if (window.drawioGenerator) {
            setTimeout(() => {
                window.drawioGenerator.loadXML(xml);
            }, 500);
        }
    }

    // 创建XML代码段
    createXMLSection(xmlId, xml) {
        return `
            <div class="xml-code" id="${xmlId}">${this.escapeHtml(xml)}</div>
            <div class="xml-actions">
                <button class="load-btn" onclick="window.uiManager.loadXMLToDrawio('${xmlId}')">
                    🚀 重新加载
                </button>
                <button class="copy-btn" onclick="window.uiManager.copyXML('${xmlId}')">
                    📋 复制XML
                </button>
            </div>
        `;
    }

    // 创建使用统计段
    createUsageSection(usage) {
        if (!usage) return '';

        return `
            <small class="token-usage">
                消耗 Tokens: ${usage.total_tokens} (提示: ${usage.prompt_tokens}, 完成: ${usage.completion_tokens})
            </small>
        `;
    }

    // 滚动到底部
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    // HTML转义（复用全局函数）
    escapeHtml(text) {
        return window.escapeHtml(text);
    }

    // 加载XML到DrawIO
    loadXMLToDrawio(xmlId) {
        const xmlElement = document.getElementById(xmlId);
        if (!xmlElement) {
            console.error('❌ XML元素未找到:', xmlId);
            this.addMessage('system', '❌ XML元素未找到');
            return;
        }

        const xml = xmlElement.textContent;
        console.log('🔍 找到XML元素，内容长度:', xml.length);

        if (!xml || xml.trim().length === 0) {
            this.addMessage('system', '❌ XML内容为空');
            return;
        }

        try {
            if (!window.drawioGenerator) {
                this.addMessage('system', '❌ DrawIO生成器未初始化');
                return;
            }

            console.log('🚀 开始加载XML到DrawIO...');
            let success = window.drawioGenerator.loadXML(xml);

            // 如果常规加载失败，尝试强制加载
            if (!success) {
                console.log('🔧 常规加载失败，尝试强制加载...');
                success = window.drawioGenerator.forceLoadXML(xml);
            }

            // 额外保障：手动隐藏占位符
            const placeholder = document.getElementById('drawioPlaceholder');
            if (placeholder && placeholder.style.display !== 'none') {
                placeholder.style.display = 'none';
                console.log('👻 UI管理器：手动隐藏占位符');
            }

            if (success) {
                setTimeout(() => {
                    this.addMessage('system', '✅ 已自动加载到编辑器！如果左侧未显示，请点击"📋 复制XML"按钮手动导入。');
                }, 500);
            } else {
                this.addMessage('system', '⏳ DrawIO正在准备中，请稍候...');
            }
        } catch (error) {
            console.error('❌ 加载失败:', error);
            this.addMessage('system', '❌ 自动加载失败: ' + error.message + '。请使用"📋 复制XML"按钮手动导入。');
        }
    }

    // 复制XML到剪贴板
    copyXML(xmlId) {
        const xmlElement = document.getElementById(xmlId);
        if (!xmlElement) return;

        const xml = xmlElement.textContent;

        navigator.clipboard.writeText(xml).then(() => {
            this.addMessage('system', '✅ XML代码已复制到剪贴板！你可以在 diagrams.net 中通过"文件 → 导入 → 从文本"粘贴使用。');
        }).catch(err => {
            console.error('复制失败:', err);
            this.addMessage('system', '❌ 复制失败，请手动选择复制');
        });
    }

    // 主题管理
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    }

    toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }

    setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (this.themeToggleBtn) {
                this.themeToggleBtn.textContent = '🌙';
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (this.themeToggleBtn) {
                this.themeToggleBtn.textContent = '☀️';
            }
        }
    }

    // 更新API状态显示
    updateApiStatus() {
        if (!this.apiStatus) return;

        const config = window.configManager.getConfig();
        const currentProvider = config.provider;

        if (config.apiKeys[currentProvider]) {
            this.apiStatus.innerHTML = `<span class="status-dot"></span><span>${currentProvider} Key已配置</span>`;
        } else {
            this.apiStatus.innerHTML = `<span class="status-dot" style="background: #f44336;"></span><span>Key未配置</span>`;
        }
    }

    // 新建对话
    newChat() {
        this.conversationHistory = [];

        if (this.chatMessages) {
            this.chatMessages.innerHTML = `
                <div class="message assistant">
                    <div class="message-content">
                        👋 你好！我是你的AI助手。描述你想要创建的流程图，我会帮你生成！
                        <br><br>
                        <strong>📌 使用步骤：</strong>
                        <br>1. 点击右上角 ⚙️ 配置API密钥
                        <br>2. 描述你想要的流程图内容
                        <br>3. AI生成后将自动加载到左侧
                        <br>4. 或点击 📋 复制XML（手动导入）
                        <br><br>
                        <small>💡 提示：点击我上方的 💡 按钮可查看更多帮助和示例模板！</small>
                    </div>
                </div>
            `;
        }

        this.addMessage('system', '新对话已开始。');
    }

    // 填充示例提示
    fillExample(text) {
        if (this.chatInput) {
            this.chatInput.value = text;
            this.chatInput.focus();
            this.closeTips();
        }
    }

    // 模态框管理
    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('active');
            this.populateSettingsUI();
        }
    }

    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('active');
        }
    }

    openTips() {
        if (this.tipsModal) {
            this.renderExamplePrompts();
            this.tipsModal.classList.add('active');
        }
    }

    // 渲染分类示例模板
    renderExamplePrompts() {
        const container = document.getElementById('examplePromptsContainer');
        if (!container) return;

        if (!this.samplePrompts || !this.samplePrompts.categories) {
            container.innerHTML = '<div class="example-prompts"><span class="example-prompt" onclick="uiManager.fillExample(\'创建一个电商订单处理流程图，包括下单、支付、发货、收货等环节\')">📦 订单流程</span><span class="example-prompt" onclick="uiManager.fillExample(\'生成一个用户登录验证流程图\')">🔐 登录流程</span><span class="example-prompt" onclick="uiManager.fillExample(\'画一个请假审批流程\')">📝 审批流程</span><span class="example-prompt" onclick="uiManager.fillExample(\'设计一个退款处理流程\')">💰 退款流程</span></div>';
            return;
        }

        let html = '';
        const icons = { '流程图': '📊', '架构图': '🏗️', 'UML图': '📐', '组织结构': '🏢' };
        const categories = this.samplePrompts.categories;

        for (const [category, items] of Object.entries(categories)) {
            const icon = icons[category] || '📌';
            html += `<div style="margin-top: 10px; margin-bottom: 4px; font-size: 13px; color: #666; font-weight: 600;">${icon} ${category}</div>`;
            html += '<div class="example-prompts">';
            for (const item of items) {
                const escaped = item.prompt.replace(/'/g, "\\'").replace(/\n/g, ' ');
                html += `<span class="example-prompt" onclick="uiManager.fillExample('${escaped}')" title="${item.difficulty}">${item.title}</span>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;
    }

    closeTips() {
        if (this.tipsModal) {
            this.tipsModal.classList.remove('active');
        }
    }

    // 处理模态框点击事件
    handleModalClick(event) {
        if (event.target === event.currentTarget) {
            if (event.target === this.settingsModal) {
                this.closeSettings();
            } else if (event.target === this.tipsModal) {
                this.closeTips();
            }
        }
    }

    // 填充设置UI
    populateSettingsUI() {
        const config = window.configManager.getConfig();

        // 填充基本信息
        const providerSelect = document.getElementById('providerSelect');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiUrlInput = document.getElementById('apiUrlInput');
        const modelSelect = document.getElementById('modelSelect');
        const streamToggle = document.getElementById('streamToggle');

        if (providerSelect) {
            providerSelect.value = config.provider;
            this.populateProviderUI(false);
        }

        if (apiKeyInput) {
            apiKeyInput.value = config.apiKeys[config.provider] || '';
        }

        if (apiUrlInput) {
            apiUrlInput.value = config.apiUrl;
        }

        if (modelSelect && config.provider !== 'custom') {
            modelSelect.value = config.model;
        }

        const customModelInput = document.getElementById('customModelInput');
        if (customModelInput && config.provider === 'custom') {
            customModelInput.value = config.model || '';
        }

        if (streamToggle) {
            streamToggle.checked = config.stream;
        }
    }

    // 填充服务商UI
    populateProviderUI(resetModel = true) {
        const provider = document.getElementById('providerSelect').value;
        const preset = window.providerPresets[provider];
        const apiUrlInput = document.getElementById('apiUrlInput');
        const modelSelect = document.getElementById('modelSelect');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const config = window.configManager.getConfig();
        const modelSelectGroup = document.getElementById('modelSelectGroup');
        const customModelGroup = document.getElementById('customModelGroup');
        const customModelInput = document.getElementById('customModelInput');

        if (!preset) return;

        // 切换模型输入方式
        if (provider === 'custom') {
            if (modelSelectGroup) modelSelectGroup.style.display = 'none';
            if (customModelGroup) customModelGroup.style.display = 'block';
            if (customModelInput) customModelInput.value = config.model || '';
        } else {
            if (modelSelectGroup) modelSelectGroup.style.display = 'block';
            if (customModelGroup) customModelGroup.style.display = 'none';
        }

        // 填充API地址
        if (apiUrlInput) {
            apiUrlInput.value = (provider === 'custom') ? config.apiUrl : preset.apiUrl;
            apiUrlInput.disabled = (provider !== 'custom');
        }

        // 填充API Key
        if (apiKeyInput) {
            apiKeyInput.value = config.apiKeys[provider] || '';
        }

        // 填充模型下拉
        if (modelSelect) {
            modelSelect.innerHTML = '';

            if (provider !== 'custom') {
                preset.models.forEach(model => {
                    modelSelect.add(new Option(model, model));
                });
                if (resetModel) {
                    modelSelect.selectedIndex = 0;
                } else if (config.model) {
                    modelSelect.value = config.model;
                }
            }
        }
    }
}

// 全局UI管理器实例
const uiManager = new UIManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
} else {
    window.UIManager = UIManager;
    window.uiManager = uiManager;
}
