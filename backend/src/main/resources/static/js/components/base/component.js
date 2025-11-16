/**
 * 基础组件类
 * 提供所有组件的基础功能和方法
 */

class BaseComponent {
    constructor() {
        this.container = null;
        this.isRendered = false;
        this.eventListeners = new Map();
        this.children = [];
        this.parent = null;
        this.props = {};
        this.state = {};
    }

    /**
     * 初始化组件
     * @param {Object} props - 组件属性
     */
    init(props = {}) {
        this.props = { ...this.props, ...props };
        this.initState();
        this.logDebug('组件初始化', { props: this.props });
    }

    /**
     * 初始化状态
     */
    initState() {
        // 子类可重写此方法
    }

    /**
     * 渲染组件
     * @param {HTMLElement} container - 容器元素
     */
    async render(container) {
        if (!container) {
            throw new Error('渲染容器不能为空');
        }

        this.container = container;

        try {
            // 渲染前清理
            this.beforeRender();

            // 执行渲染
            await this.doRender(container);

            // 渲染后处理
            this.afterRender();

            this.isRendered = true;
            this.logDebug('组件渲染完成');

        } catch (error) {
            this.logError('组件渲染失败', error);
            throw error;
        }
    }

    /**
     * 渲染前处理
     */
    beforeRender() {
        // 清理容器
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * 执行渲染
     * @param {HTMLElement} container - 容器元素
     */
    async doRender(container) {
        // 子类必须实现此方法
        throw new Error('子类必须实现 doRender 方法');
    }

    /**
     * 渲染后处理
     */
    afterRender() {
        this.bindEvents();
        this.setupChildren();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 子类可重写此方法
    }

    /**
     * 设置子组件
     */
    setupChildren() {
        // 子类可重写此方法
    }

    /**
     * 更新状态
     * @param {Object} newState - 新状态
     */
    updateState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // 如果组件已渲染，触发重新渲染
        if (this.isRendered) {
            this.onStateChange(oldState, this.state);
            this.rerender();
        }
    }

    /**
     * 状态变化回调
     * @param {Object} oldState - 旧状态
     * @param {Object} newState - 新状态
     */
    onStateChange(oldState, newState) {
        // 子类可重写此方法
    }

    /**
     * 重新渲染
     */
    async rerender() {
        if (!this.container) return;

        try {
            await this.doRender(this.container);
            this.logDebug('组件重新渲染完成');
        } catch (error) {
            this.logError('组件重新渲染失败', error);
        }
    }

    /**
     * 添加事件监听器
     * @param {HTMLElement} element - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    addEventListener(element, event, handler) {
        if (!element || !event || !handler) {
            throw new Error('事件监听器参数不完整');
        }

        element.addEventListener(event, handler);

        // 记录事件监听器以便后续清理
        const key = `${element.constructor.name}-${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push({ element, handler });

        return handler;
    }

    /**
     * 移除事件监听器
     * @param {HTMLElement} element - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    removeEventListener(element, event, handler) {
        if (!element || !event || !handler) {
            return;
        }

        element.removeEventListener(event, handler);

        // 从记录中移除
        const key = `${element.constructor.name}-${event}`;
        const listeners = this.eventListeners.get(key);
        if (listeners) {
            const index = listeners.findIndex(item =>
                item.element === element && item.handler === handler
            );
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 清理所有事件监听器
     */
    cleanupEventListeners() {
        this.eventListeners.forEach((listeners, key) => {
            listeners.forEach(({ element, handler }) => {
                element.removeEventListener('click', handler);
            });
        });
        this.eventListeners.clear();
    }

    /**
     * 添加子组件
     * @param {BaseComponent} child - 子组件
     * @param {HTMLElement} container - 子组件容器
     * @param {Object} props - 子组件属性
     */
    async addChild(child, container, props = {}) {
        if (!(child instanceof BaseComponent)) {
            throw new Error('子组件必须继承 BaseComponent');
        }

        child.parent = this;
        child.init(props);
        await child.render(container);
        this.children.push(child);

        return child;
    }

    /**
     * 移除子组件
     * @param {BaseComponent} child - 子组件
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.destroy();
            this.children.splice(index, 1);
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        this.logDebug('组件销毁');

        // 销毁子组件
        this.children.forEach(child => child.destroy());
        this.children = [];

        // 清理事件监听器
        this.cleanupEventListeners();

        // 清理引用
        this.container = null;
        this.parent = null;
        this.isRendered = false;
    }

    /**
     * 查找子组件
     * @param {Function} predicate - 查找条件
     * @returns {BaseComponent|null} 找到的子组件
     */
    findChild(predicate) {
        return this.children.find(predicate) || null;
    }

    /**
     * 查找所有符合条件的子组件
     * @param {Function} predicate - 查找条件
     * @returns {BaseComponent[]} 找到的子组件数组
     */
    findChildren(predicate) {
        return this.children.filter(predicate);
    }

    /**
     * 获取组件属性
     * @param {string} key - 属性键名
     * @returns {*} 属性值
     */
    getProp(key) {
        return this.props[key];
    }

    /**
     * 设置组件属性
     * @param {string} key - 属性键名
     * @param {*} value - 属性值
     */
    setProp(key, value) {
        this.props[key] = value;
    }

    /**
     * 获取组件状态
     * @param {string} key - 状态键名
     * @returns {*} 状态值
     */
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    /**
     * 触发自定义事件
     * @param {string} eventType - 事件类型
     * @param {Object} detail - 事件详情
     */
    emit(eventType, detail = {}) {
        const event = new CustomEvent(eventType, {
            detail: { component: this, ...detail }
        });
        this.container?.dispatchEvent(event);
    }

    /**
     * 监听自定义事件
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    on(eventType, handler) {
        this.addEventListener(this.container, eventType, handler);
    }

    /**
     * 移除自定义事件监听
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    off(eventType, handler) {
        this.removeEventListener(this.container, eventType, handler);
    }

    /**
     * 显示组件
     */
    show() {
        if (this.container) {
            this.container.style.display = '';
        }
    }

    /**
     * 隐藏组件
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * 检查组件是否可见
     * @returns {boolean} 是否可见
     */
    isVisible() {
        return this.container && this.container.style.display !== 'none';
    }

    /**
     * 添加CSS类
     * @param {string} className - CSS类名
     */
    addClass(className) {
        if (this.container) {
            this.container.classList.add(className);
        }
    }

    /**
     * 移除CSS类
     * @param {string} className - CSS类名
     */
    removeClass(className) {
        if (this.container) {
            this.container.classList.remove(className);
        }
    }

    /**
     * 切换CSS类
     * @param {string} className - CSS类名
     */
    toggleClass(className) {
        if (this.container) {
            this.container.classList.toggle(className);
        }
    }

    /**
     * 记录调试日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logDebug(message, data) {
        if (AppConfig.DEBUG.ENABLED && AppConfig.DEBUG.CONSOLE_LOGS) {
            console.log(`🔧 [${this.constructor.name}] ${message}`, data);
        }
    }

    /**
     * 记录信息日志
     * @param {string} message - 日志消息
     * @param {*} data - 附加数据
     */
    logInfo(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.info(`🔧 [${this.constructor.name}] ${message}`, data);
        }
    }

    /**
     * 记录警告日志
     * @param {string} message - 警告消息
     * @param {*} data - 附加数据
     */
    logWarning(message, data) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.warn(`⚠️ [${this.constructor.name}] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (AppConfig.DEBUG.CONSOLE_LOGS) {
            console.error(`❌ [${this.constructor.name}] ${message}`, error);
        }
    }
}

// 导出类
window.BaseComponent = BaseComponent;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseComponent;
}