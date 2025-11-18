/**
 * DrawIO集成管理模块
 * 负责DrawIO iframe的管理、XML加载和交互
 */

class DrawIOManager {
    constructor() {
        // DrawIO配置
        this.config = {
            embedUrl: 'https://embed.diagrams.net/?embed=1&proto=json&libraries=1&noSaveBtn=1&saveAndExit=0',
            placeholderVisible: true,
            autoSave: false,
            theme: 'default',
            language: 'zh'
        };

        // 状态
        this.isReady = false;
        this.isLoading = false;
        this.currentXml = null;
        this.hasUnsavedChanges = false;

        // DOM元素
        this.elements = {
            frame: null,
            placeholder: null,
            container: null
        };

        // 事件监听器
        this.eventTarget = new EventTarget();

        // DrawIO回调
        this.drawioCallbacks = new Map();

        // 初始化
        this.init();
    }

    /**
     * 初始化DrawIO管理器
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initializeFrame();
        this.logDebug('DrawIO管理器已初始化');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements.frame = document.getElementById('drawioFrame');
        this.elements.placeholder = document.getElementById('drawioPlaceholder');
        this.elements.container = document.querySelector('.drawio-container');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听DrawIO消息
        window.addEventListener('message', (event) => this.handleDrawIOMessage(event));

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.handleResize());

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * 初始化DrawIO iframe
     */
    initializeFrame() {
        if (!this.elements.frame) {
            this.logError('DrawIO iframe元素未找到');
            return;
        }

        this.elements.frame.onload = () => {
            this.isReady = true;
            this.logDebug('DrawIO iframe已加载');
            this.emitEvent('ready');
        };

        this.elements.frame.onerror = (error) => {
            this.logError('DrawIO iframe加载失败', error);
            this.emitEvent('error', { error });
        };

        // 设置iframe源
        this.elements.frame.src = this.config.embedUrl;
    }

    /**
     * 处理DrawIO消息
     * @param {MessageEvent} event - 消息事件
     */
    handleDrawIOMessage(event) {
        if (!event.data || !event.source || event.source !== this.elements.frame?.contentWindow) {
            return;
        }

        const { event: eventType, data } = event.data;

        switch (eventType) {
            case 'ready':
                this.handleReady(data);
                break;
            case 'init':
                this.handleInit(data);
                break;
            case 'export':
                this.handleExport(data);
                break;
            case 'save':
                this.handleSave(data);
                break;
            case 'exit':
                this.handleExit(data);
                break;
            case 'xml':
                this.handleXmlChange(data);
                break;
            case 'template':
                this.handleTemplate(data);
                break;
            case 'draft':
                this.handleDraft(data);
                break;
            default:
                this.logDebug('未处理的DrawIO消息', { eventType, data });
        }
    }

    /**
     * 处理DrawIO准备就绪
     * @param {object} data - 数据
     */
    handleReady(data) {
        this.logDebug('DrawIO已准备就绪', data);
        this.emitEvent('drawioReady', data);
    }

    /**
     * 处理DrawIO初始化
     * @param {object} data - 数据
     */
    handleInit(data) {
        this.logDebug('DrawIO初始化', data);

        // 如果有当前XML，加载到DrawIO
        if (this.currentXml) {
            this.loadXml(this.currentXml);
        }

        this.emitEvent('drawioInit', data);
    }

    /**
     * 处理DrawIO导出
     * @param {object} data - 导出数据
     */
    handleExport(data) {
        this.logDebug('DrawIO导出', data);

        if (data.xml) {
            this.currentXml = data.xml;
            this.emitEvent('xmlExported', { xml: data.xml, data });
        }
    }

    /**
     * 处理DrawIO保存
     * @param {object} data - 保存数据
     */
    handleSave(data) {
        this.logDebug('DrawIO保存', data);
        this.emitEvent('saved', data);
    }

    /**
     * 处理DrawIO退出
     * @param {object} data - 退出数据
     */
    handleExit(data) {
        this.logDebug('DrawIO退出', data);
        this.emitEvent('exited', data);
    }

    /**
     * 处理XML变化
     * @param {object} data - XML数据
     */
    handleXmlChange(data) {
        if (data.xml) {
            this.currentXml = data.xml;
            this.hasUnsavedChanges = true;
            this.emitEvent('xmlChanged', { xml: data.xml });
        }
    }

    /**
     * 处理模板事件
     * @param {object} data - 模板数据
     */
    handleTemplate(data) {
        this.logDebug('DrawIO模板', data);
        this.emitEvent('templateLoaded', data);
    }

    /**
     * 处理草稿事件
     * @param {object} data - 草稿数据
     */
    handleDraft(data) {
        this.logDebug('DrawIO草稿', data);
        this.emitEvent('draftLoaded', data);
    }

    /**
     * 加载XML到DrawIO
     * @param {string} xml - XML内容
     * @returns {boolean} 是否加载成功
     */
    loadXml(xml) {
        if (!this.isReady) {
            this.logError('DrawIO未准备就绪，无法加载XML');
            return false;
        }

        if (!xml || typeof xml !== 'string') {
            this.logError('无效的XML数据');
            return false;
        }

        try {
            // 验证XML格式
            this.validateXml(xml);

            // 隐藏占位符
            this.hidePlaceholder();

            // 发送XML到DrawIO
            this.sendToDrawIO({
                event: 'load',
                xml: xml
            });

            this.currentXml = xml;
            this.hasUnsavedChanges = false;

            this.logDebug('XML已加载到DrawIO');
            this.emitEvent('xmlLoaded', { xml });
            return true;
        } catch (error) {
            this.logError('加载XML到DrawIO失败', error);
            return false;
        }
    }

    /**
     * 从DrawIO获取XML
     * @returns {string|null} XML内容
     */
    getXml() {
        if (!this.isReady) {
            this.logError('DrawIO未准备就绪，无法获取XML');
            return null;
        }

        // 请求DrawIO导出
        this.sendToDrawIO({
            event: 'export'
        });

        return this.currentXml;
    }

    /**
     * 设置占位符可见性
     * @param {boolean} visible - 是否可见
     */
    setPlaceholderVisible(visible) {
        if (this.elements.placeholder) {
            if (visible) {
                this.elements.placeholder.classList.remove('hidden');
            } else {
                this.elements.placeholder.classList.add('hidden');
            }
        }
        this.config.placeholderVisible = visible;
    }

    /**
     * 隐藏占位符
     */
    hidePlaceholder() {
        this.setPlaceholderVisible(false);
    }

    /**
     * 显示占位符
     */
    showPlaceholder() {
        this.setPlaceholderVisible(true);
    }

    /**
     * 清空当前内容
     */
    clear() {
        if (this.isReady) {
            // 发送清空命令到DrawIO
            this.sendToDrawIO({
                event: 'clear'
            });
        }

        this.currentXml = null;
        this.hasUnsavedChanges = false;
        this.showPlaceholder();

        this.logDebug('DrawIO内容已清空');
        this.emitEvent('cleared');
    }

    /**
     * 重新加载DrawIO
     */
    reload() {
        this.isReady = false;
        this.currentXml = null;
        this.hasUnsavedChanges = false;
        this.showPlaceholder();

        if (this.elements.frame) {
            this.elements.frame.src = this.config.embedUrl;
        }

        this.logDebug('DrawIO重新加载中');
        this.emitEvent('reloading');
    }

    /**
     * 发送消息到DrawIO
     * @param {object} message - 消息对象
     */
    sendToDrawIO(message) {
        if (!this.isReady || !this.elements.frame?.contentWindow) {
            this.logError('DrawIO未准备就绪，无法发送消息', message);
            return;
        }

        try {
            this.elements.frame.contentWindow.postMessage(message, '*');
            this.logDebug('消息已发送到DrawIO', { event: message.event });
        } catch (error) {
            this.logError('发送消息到DrawIO失败', error);
        }
    }

    /**
     * 验证XML格式
     * @param {string} xml - XML内容
     * @throws {Error} XML格式错误
     */
    validateXml(xml) {
        // 基本的XML格式检查
        if (!xml.includes('<mxGraphModel>')) {
            throw new Error('无效的DrawIO XML格式：缺少mxGraphModel根元素');
        }

        if (!xml.includes('</mxGraphModel>')) {
            throw new Error('无效的DrawIO XML格式：缺少mxGraphModel结束标签');
        }

        if (!xml.includes('<root>')) {
            throw new Error('无效的DrawIO XML格式：缺少root元素');
        }

        if (!xml.includes('</root>')) {
            throw new Error('无效的DrawIO XML格式：缺少root结束标签');
        }
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        if (this.elements.container) {
            // 获取容器尺寸
            const rect = this.elements.container.getBoundingClientRect();
            this.emitEvent('resized', { width: rect.width, height: rect.height });
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        this.emitEvent('visibilityChanged', { isVisible });
    }

    /**
     * 设置主题
     * @param {string} theme - 主题名称
     */
    setTheme(theme) {
        this.config.theme = theme;
        if (this.isReady) {
            this.sendToDrawIO({
                event: 'theme',
                theme: theme
            });
        }
        this.logDebug('DrawIO主题已设置', { theme });
    }

    /**
     * 设置语言
     * @param {string} language - 语言代码
     */
    setLanguage(language) {
        this.config.language = language;
        if (this.isReady) {
            this.sendToDrawIO({
                event: 'lang',
                lang: language
            });
        }
        this.logDebug('DrawIO语言已设置', { language });
    }

    /**
     * 获取当前配置
     * @returns {object} 当前配置
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 更新配置
     * @param {object} newConfig - 新配置
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };

        // 检查需要重新初始化的配置
        const needsReload = (
            newConfig.embedUrl !== oldConfig.embedUrl ||
            newConfig.libraries !== oldConfig.libraries
        );

        if (needsReload) {
            this.reload();
        }

        this.logDebug('配置已更新', { oldConfig, newConfig, needsReload });
    }

    /**
     * 检查是否有未保存的更改
     * @returns {boolean} 是否有未保存的更改
     */
    hasUnsavedChanges() {
        return this.hasUnsavedChanges;
    }

    /**
     * 标记已保存
     */
    markAsSaved() {
        this.hasUnsavedChanges = false;
        this.logDebug('DrawIO更改已标记为已保存');
    }

    /**
     * 添加DrawIO回调
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    addCallback(eventType, callback) {
        this.drawioCallbacks.set(eventType, callback);
    }

    /**
     * 移除DrawIO回调
     * @param {string} eventType - 事件类型
     */
    removeCallback(eventType) {
        this.drawioCallbacks.delete(eventType);
    }

    /**
     * 执行DrawIO回调
     * @param {string} eventType - 事件类型
     * @param {*} data - 回调数据
     */
    executeCallback(eventType, data) {
        const callback = this.drawioCallbacks.get(eventType);
        if (callback && typeof callback === 'function') {
            try {
                callback(data);
            } catch (error) {
                this.logError('DrawIO回调执行失败', { eventType, error });
            }
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
            console.log(`📊 [DrawIO] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.error(`❌ [DrawIO] ${message}`, error);
        }
    }
}

// 创建全局实例
window.drawioManager = new DrawIOManager();
window.DrawIOManager = DrawIOManager;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrawIOManager;
}