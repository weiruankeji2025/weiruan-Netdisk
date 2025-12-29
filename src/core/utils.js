/**
 * 网盘直链下载工具 - 工具函数
 */

import { UI_CONFIG } from './constants.js';

/**
 * 显示提示消息
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');

  const colors = {
    success: '#52c41a',
    error: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  };

  toast.style.cssText = UI_CONFIG.TOAST_STYLE;
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 检测当前网盘平台
 */
export function detectPlatform(url = window.location.href) {
  const { SUPPORTED_PLATFORMS } = require('./constants.js');

  for (const [key, platform] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        return { key, ...platform };
      }
    }
  }

  return null;
}

/**
 * 等待元素出现
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Element not found: ' + selector));
    }, timeout);
  });
}

/**
 * 发送HTTP请求
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 提取文件名
 */
export function extractFilename(url, contentDisposition = '') {
  // 从 Content-Disposition 头提取
  if (contentDisposition) {
    const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (matches && matches[1]) {
      return decodeURIComponent(matches[1].replace(/['"]/g, ''));
    }
  }

  // 从 URL 提取
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (filename) {
      return decodeURIComponent(filename);
    }
  } catch (e) {
    // ignore
  }

  return 'download';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 解析Cookie字符串
 */
export function parseCookies(cookieStr) {
  const cookies = {};
  if (!cookieStr) return cookies;

  cookieStr.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * 获取Cookie值
 */
export function getCookie(name) {
  const cookies = parseCookies(document.cookie);
  return cookies[name] || '';
}

/**
 * 触发浏览器下载
 */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 重试函数
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * 深度克隆对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * 防抖函数
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
