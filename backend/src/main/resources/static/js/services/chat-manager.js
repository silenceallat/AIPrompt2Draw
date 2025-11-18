/**
 * 聊天消息管理模块
 * 负责聊天消息的显示、管理和交互
 */

class ChatManager {
    constructor() {
        this.messages = [];
        this.conversationHistory = [];
        this.isThinking = false;
        this.messageIdCounter = 0;

        // 配置
        this.config = {
            maxMessages: 100,
            maxHistoryLength: 20,
            autoScroll: true,
            showTimestamps: false
        };

        // DOM元素缓存
        this.elements = {
            chatMessages: null,
            chatInput: null,
            sendBtn: null,
            thinkingIndicator: null
        };

        // 事件监听器
        this.eventTarget = new EventTarget();

        // 初始化
        this.init();
    }

    /**
     * 初始化聊天管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadHistory();
        this.logDebug('聊天管理器已初始化');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements.chatMessages = document.getElementById('chatMessages');
        this.elements.chatInput = document.getElementById('chatInput');
        this.elements.sendBtn = document.getElementById('sendBtn');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入框事件
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('input', () => this.handleInputChange());
            this.elements.chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }

        // 发送按钮事件
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        // 聊天消息区域事件
        if (this.elements.chatMessages) {
            this.elements.chatMessages.addEventListener('click', (e) => this.handleMessageClick(e));
        }
    }

    /**
     * 添加消息
     * @param {string} role - 消息角色 (user/assistant/system)
     * @param {string} content - 消息内容
     * @param {string} xml - XML数据（可选）
     * @param {object} usage - 使用情况（可选）
     * @returns {string} 消息ID
     */
    addMessage(role, content, xml = null, usage = null) {
        const messageId = this.generateMessageId();
        const message = {
            id: messageId,
            role: role,
            content: content,
            xml: xml,
            usage: usage,
            timestamp: new Date(),
            isThinking: false
        };

        // 添加到消息列表
        this.messages.push(message);

        // 限制消息数量
        if (this.messages.length > this.config.maxMessages) {
            this.messages.shift();
        }

        // 添加到对话历史
        if (role !== 'system') {
            this.conversationHistory.push({
                role: role,
                content: content
            });

            // 限制历史长度
            if (this.conversationHistory.length > this.config.maxHistoryLength) {
                this.conversationHistory.shift();
            }
        }

        // 渲染消息
        this.renderMessage(message);

        // 自动滚动到底部
        if (this.config.autoScroll) {
            this.scrollToBottom();
        }

        // 保存历史
        this.saveHistory();

        // 触发事件
        this.emitEvent('messageAdded', message);

        this.logDebug('消息已添加', { role, messageId, hasXml: !!xml });

        return messageId;
    }

    /**
     * 添加思考中消息
     */
    addThinkingMessage() {
        if (this.isThinking) return;

        const messageId = this.generateMessageId();
        const message = {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isThinking: true
        };

        this.messages.push(message);
        this.isThinking = true;

        this.renderThinkingMessage(message);
        this.scrollToBottom();

        this.logDebug('思考中消息已添加', { messageId });
    }

    /**
     * 移除思考中消息
     */
    removeThinkingMessage() {
        if (!this.isThinking) return;

        const thinkingIndex = this.messages.findIndex(msg => msg.isThinking);
        if (thinkingIndex !== -1) {
            const thinkingMessage = this.messages[thinkingIndex];
            this.messages.splice(thinkingIndex, 1);

            // 移除DOM元素
            const thinkingElement = document.getElementById(`message-${thinkingMessage.id}`);
            if (thinkingElement) {
                thinkingElement.remove();
            }

            this.isThinking = false;
            this.logDebug('思考中消息已移除');
        }
    }

    /**
     * 更新消息内容
     * @param {string} messageId - 消息ID
     * @param {string} content - 新内容
     * @param {string} xml - XML数据（可选）
     */
    updateMessage(messageId, content, xml = null) {
        const message = this.messages.find(msg => msg.id === messageId);
        if (!message) return;

        message.content = content;
        if (xml !== null) {
            message.xml = xml;
        }

        // 更新DOM
        this.updateMessageElement(message);

        this.emitEvent('messageUpdated', message);
        this.logDebug('消息已更新', { messageId });
    }

    /**
     * 渲染消息
     * @param {object} message - 消息对象
     */
    renderMessage(message) {
        if (!this.elements.chatMessages) return;

        const messageElement = this.createMessageElement(message);
        this.elements.chatMessages.appendChild(messageElement);

        // 添加进入动画
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(10px)';

        setTimeout(() => {
            messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * 渲染思考中消息
     * @param {object} message - 消息对象
     */
    renderThinkingMessage(message) {
        if (!this.elements.chatMessages) return;

        const thinkingElement = this.createThinkingElement(message);
        this.elements.chatMessages.appendChild(thinkingElement);

        // 添加动画
        thinkingElement.style.opacity = '0';
        thinkingElement.style.transform = 'translateY(10px)';

        setTimeout(() => {
            thinkingElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            thinkingElement.style.opacity = '1';
            thinkingElement.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * 创建消息元素
     * @param {object} message - 消息对象
     * @returns {HTMLElement} 消息元素
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.id = `message-${message.id}`;
        messageDiv.className = `message ${message.role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // 处理内容中的换行和格式
        let formattedContent = this.formatMessageContent(message.content);
        contentDiv.innerHTML = formattedContent;

        // 添加XML代码块
        if (message.xml) {
            const xmlBlock = this.createXMLCodeBlock(message.xml);
            contentDiv.appendChild(xmlBlock);

            // 添加操作按钮
            const actionsDiv = this.createMessageActions(message);
            contentDiv.appendChild(actionsDiv);
        }

        // 添加使用情况
        if (message.usage) {
            const usageSpan = this.createUsageSpan(message.usage);
            contentDiv.appendChild(usageSpan);
        }

        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }

    /**
     * 创建思考中元素
     * @param {object} message - 消息对象
     * @returns {HTMLElement} 思考中元素
     */
    createThinkingElement(message) {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = `message-${message.id}`;
        thinkingDiv.className = 'message assistant';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'thinking-indicator';
        indicatorDiv.innerHTML = `
            <div class="thinking-spinner"></div>
            <span>AI正在思考中...</span>
        `;

        contentDiv.appendChild(indicatorDiv);
        thinkingDiv.appendChild(contentDiv);

        return thinkingDiv;
    }

    /**
     * 创建XML代码块
     * @param {string} xml - XML内容
     * @returns {HTMLElement} 代码块元素
     */
    createXMLCodeBlock(xml) {
        const xmlDiv = document.createElement('div');
        xmlDiv.className = 'xml-code';
        xmlDiv.textContent = xml;
        return xmlDiv;
    }

    /**
     * 创建消息操作按钮
     * @param {object} message - 消息对象
     * @returns {HTMLElement} 操作按钮容器
     */
    createMessageActions(message) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'xml-actions';

        // 加载到DrawIO按钮
        const loadBtn = document.createElement('button');
        loadBtn.className = 'load-btn';
        loadBtn.textContent = '🎨 加载到DrawIO';
        loadBtn.onclick = () => this.handleLoadToDrawIO(message);

        // 复制XML按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 复制XML';
        copyBtn.onclick = () => this.handleCopyXML(message);

        actionsDiv.appendChild(loadBtn);
        actionsDiv.appendChild(copyBtn);

        return actionsDiv;
    }

    /**
     * 创建使用情况显示
     * @param {object} usage - 使用情况
     * @returns {HTMLElement} 使用情况元素
     */
    createUsageSpan(usage) {
        const usageSpan = document.createElement('span');
        usageSpan.className = 'token-usage';

        let usageText = '';
        if (usage.prompt_tokens || usage.completion_tokens) {
            usageText = `Tokens: ${usage.prompt_tokens || 0} + ${usage.completion_tokens || 0} = ${usage.total_tokens || 0}`;
        }

        usageSpan.textContent = usageText;
        return usageSpan;
    }

    /**
     * 格式化消息内容
     * @param {string} content - 原始内容
     * @returns {string} 格式化后的内容
     */
    formatMessageContent(content) {
        // 处理代码块
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || ''}">${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // 处理链接
        content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

        // 处理换行
        content = content.replace(/\n/g, '<br>');

        return content;
    }

    /**
     * 转义HTML字符
     * @param {string} text - 原始文本
     * @returns {string} 转义后的文本
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新消息元素
     * @param {object} message - 消息对象
     */
    updateMessageElement(message) {
        const messageElement = document.getElementById(`message-${message.id}`);
        if (!messageElement) return;

        const contentDiv = messageElement.querySelector('.message-content');
        if (!contentDiv) return;

        // 更新内容
        let formattedContent = this.formatMessageContent(message.content);

        // 保留XML和操作按钮
        const xmlBlock = contentDiv.querySelector('.xml-code');
        const actionsDiv = contentDiv.querySelector('.xml-actions');
        const usageSpan = contentDiv.querySelector('.token-usage');

        // 清空并重新设置内容
        contentDiv.innerHTML = formattedContent;

        // 重新添加XML块
        if (message.xml && xmlBlock) {
            contentDiv.appendChild(xmlBlock);
        }

        // 重新添加操作按钮
        if (message.xml && actionsDiv) {
            contentDiv.appendChild(actionsDiv);
        }

        // 重新添加使用情况
        if (usageSpan) {
            contentDiv.appendChild(usageSpan);
        }
    }

    /**
     * 清空所有消息
     */
    clearMessages() {
        this.messages = [];
        this.conversationHistory = [];
        this.isThinking = false;

        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }

        this.saveHistory();
        this.emitEvent('messagesCleared');
        this.logDebug('所有消息已清空');
    }

    /**
     * 获取消息列表
     * @returns {Array} 消息列表
     */
    getMessages() {
        return [...this.messages];
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史
     */
    getConversationHistory() {
        return [...this.conversationHistory];
    }

    /**
     * 获取最后一条用户消息
     * @returns {object|null} 最后一条用户消息
     */
    getLastUserMessage() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === 'user') {
                return this.messages[i];
            }
        }
        return null;
    }

    /**
     * 获取最后一条助手消息
     * @returns {object|null} 最后一条助手消息
     */
    getLastAssistantMessage() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === 'assistant' && !this.messages[i].isThinking) {
                return this.messages[i];
            }
        }
        return null;
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        if (this.elements.chatMessages) {
            this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        }
    }

    /**
     * 处理输入变化
     */
    handleInputChange() {
        if (this.elements.chatInput) {
            // 自动调整高度
            this.elements.chatInput.style.height = 'auto';
            this.elements.chatInput.style.height = Math.min(this.elements.chatInput.scrollHeight, 120) + 'px';
        }

        this.emitEvent('inputChanged', { value: this.getInputValue() });
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSendMessage();
        }
    }

    /**
     * 处理发送消息
     */
    handleSendMessage() {
        const content = this.getInputValue().trim();
        if (!content) return;

        // 清空输入框
        this.setInputValue('');
        this.resetInputHeight();

        // 触发发送事件
        this.emitEvent('sendMessage', { content });
    }

    /**
     * 处理消息点击
     * @param {Event} event - 点击事件
     */
    handleMessageClick(event) {
        const messageElement = event.target.closest('.message');
        if (!messageElement) return;

        const messageId = messageElement.id.replace('message-', '');
        const message = this.messages.find(msg => msg.id === messageId);
        if (message) {
            this.emitEvent('messageClicked', { message, event });
        }
    }

    /**
     * 处理加载到DrawIO
     * @param {object} message - 消息对象
     */
    handleLoadToDrawIO(message) {
        if (!message.xml) return;

        this.emitEvent('loadToDrawIO', { xml: message.xml, message });
        this.logDebug('加载到DrawIO', { messageId: message.id });
    }

    /**
     * 处理复制XML
     * @param {object} message - 消息对象
     */
    handleCopyXML(message) {
        if (!message.xml) return;

        try {
            navigator.clipboard.writeText(message.xml).then(() => {
                this.showMessage('XML已复制到剪贴板', 'success');
            }).catch(() => {
                // 降级处理
                this.fallbackCopyToClipboard(message.xml);
            });
        } catch (error) {
            this.logError('复制XML失败', error);
            this.fallbackCopyToClipboard(message.xml);
        }
    }

    /**
     * 降级复制到剪贴板
     * @param {string} text - 要复制的文本
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        try {
            document.execCommand('copy');
            this.showMessage('XML已复制到剪贴板', 'success');
        } catch (error) {
            this.logError('降级复制失败', error);
            this.showMessage('复制失败，请手动选择复制', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (info/success/warning/error)
     */
    showMessage(message, type = 'info') {
        // 这里可以集成到全局消息系统
        this.emitEvent('showMessage', { message, type });
    }

    /**
     * 获取输入框内容
     * @returns {string} 输入内容
     */
    getInputValue() {
        return this.elements.chatInput ? this.elements.chatInput.value : '';
    }

    /**
     * 设置输入框内容
     * @param {string} value - 输入内容
     */
    setInputValue(value) {
        if (this.elements.chatInput) {
            this.elements.chatInput.value = value;
        }
    }

    /**
     * 重置输入框高度
     */
    resetInputHeight() {
        if (this.elements.chatInput) {
            this.elements.chatInput.style.height = 'auto';
        }
    }

    /**
     * 设置发送按钮状态
     * @param {boolean} disabled - 是否禁用
     * @param {string} text - 按钮文本
     */
    setSendButtonState(disabled, text = '发送') {
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = disabled;
            this.elements.sendBtn.textContent = text;
        }
    }

    /**
     * 保存历史记录
     */
    saveHistory() {
        try {
            const historyData = {
                messages: this.messages.slice(-50), // 只保存最近50条消息
                conversationHistory: this.conversationHistory,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('chat-history', JSON.stringify(historyData));
        } catch (error) {
            this.logError('保存历史记录失败', error);
        }
    }

    /**
     * 加载历史记录
     */
    loadHistory() {
        try {
            const historyData = localStorage.getItem('chat-history');
            if (historyData) {
                const history = JSON.parse(historyData);
                if (history.messages && Array.isArray(history.messages)) {
                    this.messages = history.messages;
                }
                if (history.conversationHistory && Array.isArray(history.conversationHistory)) {
                    this.conversationHistory = history.conversationHistory;
                }
                this.logDebug('历史记录已加载', {
                    messageCount: this.messages.length,
                    historyCount: this.conversationHistory.length
                });
            }
        } catch (error) {
            this.logError('加载历史记录失败', error);
        }
    }

    /**
     * 生成消息ID
     * @returns {string} 消息ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${++this.messageIdCounter}`;
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
            console.log(`💬 [Chat] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.error(`❌ [Chat] ${message}`, error);
        }
    }
}

// 创建全局实例
window.chatManager = new ChatManager();
window.ChatManager = ChatManager;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatManager;
}