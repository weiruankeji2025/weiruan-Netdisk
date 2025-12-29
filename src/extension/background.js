/**
 * Chrome Extension - Background Script
 * 处理后台任务和消息通信
 */

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('网盘直链下载增强工具已安装');

    // 设置默认配置
    chrome.storage.local.set({
      settings: {
        autoDownload: false,
        showNotification: true,
        downloadHistory: true
      },
      statistics: {
        totalDownloads: 0,
        lastDownloadTime: null
      }
    });
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'download':
      handleDownload(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 保持消息通道开启

    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse({ success: true, data: result.settings });
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.set({ settings: request.data }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'getStatistics':
      chrome.storage.local.get(['statistics'], (result) => {
        sendResponse({ success: true, data: result.statistics });
      });
      return true;

    case 'crossOriginRequest':
      handleCrossOriginRequest(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

/**
 * 处理下载请求
 */
async function handleDownload(data) {
  const { url, filename } = data;

  try {
    // 使用Chrome下载API
    const downloadId = await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });

    // 更新统计数据
    updateStatistics();

    // 显示通知
    const settings = await getSettings();
    if (settings.showNotification) {
      showNotification('下载已开始', `正在下载: ${filename}`);
    }

    return { downloadId, filename };
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * 处理跨域请求
 */
async function handleCrossOriginRequest(data) {
  const { url, options = {} } = data;

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      credentials: 'include'
    });

    const contentType = response.headers.get('content-type');
    let result;

    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: result
    };
  } catch (error) {
    console.error('Cross-origin request failed:', error);
    throw error;
  }
}

/**
 * 获取设置
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {});
    });
  });
}

/**
 * 更新统计数据
 */
async function updateStatistics() {
  chrome.storage.local.get(['statistics'], (result) => {
    const stats = result.statistics || { totalDownloads: 0 };
    stats.totalDownloads = (stats.totalDownloads || 0) + 1;
    stats.lastDownloadTime = Date.now();

    chrome.storage.local.set({ statistics: stats });
  });
}

/**
 * 显示通知
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 1
  });
}

/**
 * 监听下载状态变化
 */
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    console.log('Download completed:', delta.id);
  }

  if (delta.error) {
    console.error('Download error:', delta.error);
    showNotification('下载失败', `错误: ${delta.error.current}`);
  }
});

// 监听插件图标点击
chrome.action.onClicked.addListener((tab) => {
  // 发送消息到content script
  chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
});
