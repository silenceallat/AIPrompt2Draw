/**
 * 配额管理服务
 * 负责用户配额查询、使用统计和配额提醒
 */

class QuotaService {
    constructor() {
        // 事件监听器
        this.eventTarget = new EventTarget();

        // 配额数据
        this.quotaData = {
            totalQuota: 0,
            usedQuota: 0,
            remainingQuota: 0,
            quotaUnit: 'times',
            lastUpdated: null,
            usageHistory: []
        };

        // 配置
        this.config = {
            refreshInterval: 30000, // 30秒刷新一次
            warningThreshold: 0.2,  // 20%时警告
            criticalThreshold: 0.1, // 10%时严重警告
            maxHistoryRecords: 100   // 最大历史记录数
        };

        // 定时器
        this.refreshTimer = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化配额服务
     */
    init() {
        this.loadQuotaFromStorage();
        this.startAutoRefresh();
        this.logDebug('配额服务已初始化');
    }

    /**
     * 从本地存储加载配额数据
     */
    loadQuotaFromStorage() {
        try {
            const storedQuota = this.getStorageItem('quota-data');
            if (storedQuota) {
                this.quotaData = { ...this.quotaData, ...storedQuota };
                this.logDebug('从本地存储加载配额数据', this.quotaData);
            }
        } catch (error) {
            this.logError('加载配额数据失败', error);
        }
    }

    /**
     * 保存配额数据到本地存储
     */
    saveQuotaToStorage() {
        try {
            this.setStorageItem('quota-data', this.quotaData);
        } catch (error) {
            this.logError('保存配额数据失败', error);
        }
    }

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshTimer = setInterval(() => {
            this.refreshQuota();
        }, this.config.refreshInterval);
    }

    /**
     * 停止自动刷新
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * 刷新配额信息
     * @param {boolean} force - 是否强制刷新
     * @returns {Promise<boolean>} 是否刷新成功
     */
    async refreshQuota(force = false) {
        // 检查是否需要刷新
        if (!force && this.quotaData.lastUpdated) {
            const timeSinceLastUpdate = Date.now() - new Date(this.quotaData.lastUpdated).getTime();
            if (timeSinceLastUpdate < this.config.refreshInterval) {
                return false;
            }
        }

        if (!window.apiClient) {
            this.logDebug('API客户端未初始化，跳过配额刷新');
            return false;
        }

        try {
            this.logDebug('开始刷新配额信息');

            const response = await window.apiClient.get('/v1/user/quota');
            if (response.success && response.data) {
                this.updateQuotaData(response.data);
                this.saveQuotaToStorage();
                this.emitEvent('quotaUpdated', this.quotaData);
                this.checkQuotaWarnings();
                return true;
            }
        } catch (error) {
            this.logError('刷新配额信息失败', error);
            this.emitEvent('quotaError', error);
        }

        return false;
    }

    /**
     * 更新配额数据
     * @param {object} data - 新的配额数据
     */
    updateQuotaData(data) {
        const oldData = { ...this.quotaData };

        this.quotaData = {
            totalQuota: data.totalQuota || this.quotaData.totalQuota,
            usedQuota: data.usedQuota || this.quotaData.usedQuota,
            remainingQuota: data.remainingQuota || this.quotaData.remainingQuota,
            quotaUnit: data.quotaUnit || this.quotaData.quotaUnit,
            lastUpdated: new Date().toISOString(),
            usageHistory: this.quotaData.usageHistory
        };

        // 重新计算剩余配额
        if (this.quotaData.totalQuota > 0 && this.quotaData.usedQuota >= 0) {
            this.quotaData.remainingQuota = this.quotaData.totalQuota - this.quotaData.usedQuota;
        }

        // 添加到使用历史
        if (data.usageRecord) {
            this.addToUsageHistory(data.usageRecord);
        }

        // 检查是否有变化
        const hasChanged = JSON.stringify(oldData) !== JSON.stringify(this.quotaData);
        if (hasChanged) {
            this.logDebug('配额数据已更新', { oldData, newData: this.quotaData });
        }
    }

    /**
     * 添加使用记录到历史
     * @param {object} record - 使用记录
     */
    addToUsageHistory(record) {
        const historyRecord = {
            ...record,
            timestamp: record.timestamp || new Date().toISOString()
        };

        this.quotaData.usageHistory.unshift(historyRecord);

        // 限制历史记录数量
        if (this.quotaData.usageHistory.length > this.config.maxHistoryRecords) {
            this.quotaData.usageHistory = this.quotaData.usageHistory.slice(0, this.config.maxHistoryRecords);
        }
    }

    /**
     * 检查配额警告
     */
    checkQuotaWarnings() {
        const usagePercentage = this.getUsagePercentage();

        if (usagePercentage >= (1 - this.config.criticalThreshold)) {
            // 严重警告
            this.emitEvent('quotaCritical', {
                percentage: usagePercentage,
                remaining: this.quotaData.remainingQuota,
                total: this.quotaData.totalQuota
            });
        } else if (usagePercentage >= (1 - this.config.warningThreshold)) {
            // 一般警告
            this.emitEvent('quotaWarning', {
                percentage: usagePercentage,
                remaining: this.quotaData.remainingQuota,
                total: this.quotaData.totalQuota
            });
        }
    }

    /**
     * 获取使用百分比
     * @returns {number} 使用百分比 (0-1)
     */
    getUsagePercentage() {
        if (this.quotaData.totalQuota <= 0) {
            return 0;
        }
        return Math.min(1, Math.max(0, this.quotaData.usedQuota / this.quotaData.totalQuota));
    }

    /**
     * 获取剩余百分比
     * @returns {number} 剩余百分比 (0-1)
     */
    getRemainingPercentage() {
        return 1 - this.getUsagePercentage();
    }

    /**
     * 检查是否有足够的配额
     * @param {number} requiredQuota - 所需配额
     * @returns {boolean} 是否有足够配额
     */
    hasEnoughQuota(requiredQuota = 1) {
        return this.quotaData.remainingQuota >= requiredQuota;
    }

    /**
     * 获取配额状态
     * @returns {string} 配额状态 ('normal', 'warning', 'critical', 'exceeded')
     */
    getQuotaStatus() {
        const usagePercentage = this.getUsagePercentage();

        if (usagePercentage >= 1) {
            return 'exceeded';
        } else if (usagePercentage >= (1 - this.config.criticalThreshold)) {
            return 'critical';
        } else if (usagePercentage >= (1 - this.config.warningThreshold)) {
            return 'warning';
        } else {
            return 'normal';
        }
    }

    /**
     * 格式化配额显示
     * @param {number} quota - 配额数量
     * @returns {string} 格式化后的配额字符串
     */
    formatQuota(quota) {
        if (quota >= 1000000) {
            return (quota / 1000000).toFixed(1) + 'M';
        } else if (quota >= 1000) {
            return (quota / 1000).toFixed(1) + 'K';
        } else {
            return quota.toString();
        }
    }

    /**
     * 获取配额摘要信息
     * @returns {object} 配额摘要
     */
    getQuotaSummary() {
        const usagePercentage = this.getUsagePercentage();
        const remainingPercentage = this.getRemainingPercentage();
        const status = this.getQuotaStatus();

        return {
            totalQuota: this.quotaData.totalQuota,
            usedQuota: this.quotaData.usedQuota,
            remainingQuota: this.quotaData.remainingQuota,
            quotaUnit: this.quotaData.quotaUnit,
            usagePercentage: usagePercentage,
            remainingPercentage: remainingPercentage,
            status: status,
            lastUpdated: this.quotaData.lastUpdated,
            hasQuota: this.quotaData.totalQuota > 0,
            hasEnoughQuota: this.hasEnoughQuota()
        };
    }

    /**
     * 手动减少配额
     * @param {number} amount - 减少数量
     * @param {string} reason - 减少原因
     */
    consumeQuota(amount = 1, reason = 'AI生成') {
        if (this.hasEnoughQuota(amount)) {
            this.quotaData.usedQuota += amount;
            this.quotaData.remainingQuota = Math.max(0, this.quotaData.totalQuota - this.quotaData.usedQuota);
            this.quotaData.lastUpdated = new Date().toISOString();

            // 添加使用记录
            this.addToUsageHistory({
                amount: amount,
                reason: reason,
                type: 'consume'
            });

            this.saveQuotaToStorage();
            this.emitEvent('quotaConsumed', { amount, reason, remaining: this.quotaData.remainingQuota });
            this.checkQuotaWarnings();
            return true;
        } else {
            this.emitEvent('quotaInsufficient', { required: amount, available: this.quotaData.remainingQuota });
            return false;
        }
    }

    /**
     * 获取使用历史统计
     * @param {number} days - 统计天数
     * @returns {object} 使用统计
     */
    getUsageStatistics(days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const recentHistory = this.quotaData.usageHistory.filter(record => {
            return new Date(record.timestamp) >= startDate;
        });

        const totalUsage = recentHistory.reduce((sum, record) => {
            return sum + (record.amount || 0);
        }, 0);

        const dailyUsage = {};
        recentHistory.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            dailyUsage[date] = (dailyUsage[date] || 0) + (record.amount || 0);
        });

        return {
            period: days,
            totalUsage: totalUsage,
            dailyUsage: dailyUsage,
            averageDailyUsage: totalUsage / days,
            recordCount: recentHistory.length
        };
    }

    /**
     * 重置配额数据
     */
    resetQuotaData() {
        this.quotaData = {
            totalQuota: 0,
            usedQuota: 0,
            remainingQuota: 0,
            quotaUnit: 'times',
            lastUpdated: null,
            usageHistory: []
        };

        this.saveQuotaToStorage();
        this.emitEvent('quotaReset', this.quotaData);
        this.logDebug('配额数据已重置');
    }

    /**
     * 更新配置
     * @param {object} newConfig - 新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // 如果刷新间隔发生变化，重新启动定时器
        if (newConfig.refreshInterval) {
            this.startAutoRefresh();
        }

        this.logDebug('配额服务配置已更新', this.config);
        this.emitEvent('configUpdated', this.config);
    }

    /**
     * 销毁服务
     */
    destroy() {
        this.stopAutoRefresh();
        this.saveQuotaToStorage();
        this.logDebug('配额服务已销毁');
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
            console.log(`📊 [QuotaService] ${message}`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message - 错误消息
     * @param {*} error - 错误对象
     */
    logError(message, error) {
        if (window.AppConfig?.DEBUG?.CONSOLE_LOGS) {
            console.error(`❌ [QuotaService] ${message}`, error);
        }
    }
}

// 创建全局实例
window.quotaService = new QuotaService();
window.QuotaService = QuotaService;

// 导出类（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuotaService;
}