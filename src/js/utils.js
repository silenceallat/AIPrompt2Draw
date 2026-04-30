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

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
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

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml, Storage, downloadFile, readFile, copyToClipboard };
} else {
    window.Utils = { escapeHtml, Storage, downloadFile, readFile, copyToClipboard };
    window.escapeHtml = escapeHtml;
    window.Storage = Storage;
    window.downloadFile = downloadFile;
    window.readFile = readFile;
    window.copyToClipboard = copyToClipboard;
}
