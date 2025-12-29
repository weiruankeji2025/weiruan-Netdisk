/**
 * Popup Script - 弹出窗口交互逻辑
 */

// 加载统计数据
function loadStatistics() {
    chrome.storage.local.get(['statistics'], (result) => {
        const stats = result.statistics || { totalDownloads: 0 };

        document.getElementById('total-downloads').textContent = stats.totalDownloads || 0;

        // 计算今日下载数
        const today = new Date().setHours(0, 0, 0, 0);
        const todayDownloads = stats.lastDownloadTime && stats.lastDownloadTime >= today ? stats.todayCount || 0 : 0;
        document.getElementById('today-downloads').textContent = todayDownloads;
    });
}

// 加载设置
function loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || {
            showNotification: true,
            downloadHistory: true
        };

        document.getElementById('show-notification').checked = settings.showNotification;
        document.getElementById('save-history').checked = settings.downloadHistory;
    });
}

// 保存设置
function saveSettings() {
    const settings = {
        showNotification: document.getElementById('show-notification').checked,
        downloadHistory: document.getElementById('save-history').checked
    };

    chrome.storage.local.set({ settings }, () => {
        // 显示保存成功提示
        showToast('设置已保存');
    });
}

// 清除下载历史
function clearHistory() {
    if (confirm('确定要清除下载历史吗?')) {
        chrome.storage.local.set({
            statistics: {
                totalDownloads: 0,
                todayCount: 0,
                lastDownloadTime: null
            }
        }, () => {
            loadStatistics();
            showToast('历史已清除');
        });
    }
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #52c41a;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadSettings();

    // 设置变更事件
    document.getElementById('show-notification').addEventListener('change', saveSettings);
    document.getElementById('save-history').addEventListener('change', saveSettings);

    // 清除历史按钮
    document.getElementById('clear-history').addEventListener('click', clearHistory);

    // 定期刷新统计数据
    setInterval(loadStatistics, 5000);
});
