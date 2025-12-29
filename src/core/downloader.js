/**
 * 网盘直链下载工具 - 下载器基类
 */

import { showToast, fetchWithTimeout, extractFilename, retry } from './utils.js';
import { DOWNLOAD_CONFIG } from './constants.js';

export class BaseDownloader {
  constructor(platform) {
    this.platform = platform;
    this.downloadQueue = [];
    this.isProcessing = false;
  }

  /**
   * 获取直链下载地址 - 需要子类实现
   */
  async getDirectLink(fileInfo) {
    throw new Error('getDirectLink must be implemented by subclass');
  }

  /**
   * 解析页面文件信息 - 需要子类实现
   */
  async parseFileInfo() {
    throw new Error('parseFileInfo must be implemented by subclass');
  }

  /**
   * 执行下载
   */
  async download(fileInfo) {
    try {
      showToast(`正在获取${this.platform.name}直链...`, 'info');

      const directLink = await retry(
        () => this.getDirectLink(fileInfo),
        DOWNLOAD_CONFIG.MAX_RETRIES
      );

      if (!directLink) {
        throw new Error('无法获取直链地址');
      }

      const filename = fileInfo.filename || extractFilename(directLink);

      showToast(`开始下载: ${filename}`, 'success');

      // 使用浏览器原生下载
      this.triggerBrowserDownload(directLink, filename);

      // 记录下载历史
      this.recordDownload({
        filename,
        url: directLink,
        platform: this.platform.name,
        timestamp: Date.now()
      });

      return { success: true, filename, url: directLink };
    } catch (error) {
      console.error('Download failed:', error);
      showToast(`下载失败: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * 触发浏览器下载
   */
  triggerBrowserDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    a.target = '_blank';
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }

  /**
   * 批量下载
   */
  async batchDownload(fileList) {
    const results = [];

    for (const file of fileList) {
      const result = await this.download(file);
      results.push(result);

      // 添加延迟,避免触发反爬
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * 记录下载历史
   */
  recordDownload(info) {
    try {
      const history = JSON.parse(localStorage.getItem('netdisk_download_history') || '[]');
      history.unshift(info);

      // 只保留最近100条
      if (history.length > 100) {
        history.length = 100;
      }

      localStorage.setItem('netdisk_download_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to record download history:', e);
    }
  }

  /**
   * 发送跨域请求 (使用GM_xmlhttpRequest或fetch)
   */
  async crossOriginRequest(url, options = {}) {
    // 优先使用GM_xmlhttpRequest (油猴脚本环境)
    if (typeof GM_xmlhttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: options.method || 'GET',
          url: url,
          headers: options.headers || {},
          data: options.body,
          timeout: DOWNLOAD_CONFIG.TIMEOUT,
          onload: (response) => {
            resolve({
              ok: response.status >= 200 && response.status < 300,
              status: response.status,
              statusText: response.statusText,
              headers: response.responseHeaders,
              text: () => Promise.resolve(response.responseText),
              json: () => Promise.resolve(JSON.parse(response.responseText))
            });
          },
          onerror: (error) => reject(error),
          ontimeout: () => reject(new Error('Request timeout'))
        });
      });
    }

    // 降级使用fetch
    return fetchWithTimeout(url, options, DOWNLOAD_CONFIG.TIMEOUT);
  }
}
