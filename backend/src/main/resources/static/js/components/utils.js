/**
 * AIPrompt2Draw - 工具函数模块
 * 提供通用的工具函数和辅助方法
 */

// HTML转义函数
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '\n': '<br>'
    };
    return text.replace(/[&<>"'\n]/g, m => map[m]);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 深拷贝函数
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化时间
function formatTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 小于1分钟
        return '刚刚';
    } else if (diff < 3600000) { // 小于1小时
        return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) { // 小于1天
        return Math.floor(diff / 3600000) + '小时前';
    } else {
        return date.toLocaleDateString();
    }
}

// 生成随机ID
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// URL参数解析
function parseUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');

    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    }

    return params;
}

// 设置URL参数
function setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
}

// 移除URL参数
function removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
}

// 本地存储封装
class Storage {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage.set error:', error);
            return false;
        }
    }

    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage.get error:', error);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage.remove error:', error);
            return false;
        }
    }

    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage.clear error:', error);
            return false;
        }
    }
}

// 文件下载函数
function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 文件读取函数
function readFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('文件为空'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 验证邮箱格式
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 验证URL格式
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// 获取文件扩展名
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 计算字符串哈希
function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return hash;
}

// 检测设备类型
function detectDevice() {
    const userAgent = navigator.userAgent;

    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'tablet';
    }

    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        return 'mobile';
    }

    return 'desktop';
}

// 检测浏览器类型
function detectBrowser() {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    if (userAgent.includes('Opera')) return 'opera';

    return 'unknown';
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // 兼容旧浏览器
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (error) {
        console.error('复制失败:', error);
        return false;
    }
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 添加样式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease'
    });

    // 设置背景色
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// 加载外部脚本
function loadScript(src, async = true) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = async;

        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(script);
    });
}

// 加载外部样式
function loadStyle(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;

        link.onload = () => resolve(link);
        link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));

        document.head.appendChild(link);
    });
}

// 等待DOM加载完成
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// 性能监控
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} 执行时间: ${end - start} 毫秒`);
    return result;
}

// 重试函数
async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxAttempts - 1) throw error;
            console.warn(`第 ${i + 1} 次尝试失败，${delay}ms 后重试:`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 导出所有函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        debounce,
        throttle,
        deepClone,
        formatFileSize,
        formatTime,
        generateId,
        parseUrlParams,
        setUrlParam,
        removeUrlParam,
        Storage,
        downloadFile,
        readFile,
        validateEmail,
        validateUrl,
        getFileExtension,
        formatNumber,
        hashString,
        detectDevice,
        detectBrowser,
        copyToClipboard,
        showNotification,
        loadScript,
        loadStyle,
        domReady,
        measurePerformance,
        retry
    };
} else {
    // 将所有函数添加到全局对象
    window.Utils = {
        escapeHtml,
        debounce,
        throttle,
        deepClone,
        formatFileSize,
        formatTime,
        generateId,
        parseUrlParams,
        setUrlParam,
        removeUrlParam,
        Storage,
        downloadFile,
        readFile,
        validateEmail,
        validateUrl,
        getFileExtension,
        formatNumber,
        hashString,
        detectDevice,
        detectBrowser,
        copyToClipboard,
        showNotification,
        loadScript,
        loadStyle,
        domReady,
        measurePerformance,
        retry
    };

    // 也将函数直接添加到window对象
    Object.assign(window, {
        escapeHtml,
        debounce,
        throttle,
        deepClone,
        formatFileSize,
        formatTime,
        generateId,
        parseUrlParams,
        setUrlParam,
        removeUrlParam,
        Storage,
        downloadFile,
        readFile,
        validateEmail,
        validateUrl,
        getFileExtension,
        formatNumber,
        hashString,
        detectDevice,
        detectBrowser,
        copyToClipboard,
        showNotification,
        loadScript,
        loadStyle,
        domReady,
        measurePerformance,
        retry
    });
}