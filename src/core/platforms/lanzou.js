/**
 * 蓝奏云下载器
 */

import { BaseDownloader } from '../downloader.js';
import { waitForElement } from '../utils.js';

export class LanzouDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    try {
      // 蓝奏云页面结构
      const filename = document.querySelector('.filethetext')?.textContent?.trim() ||
                      document.querySelector('.b')?.textContent?.trim() ||
                      document.title;

      const fileSize = document.querySelector('.n_filesize')?.textContent?.trim() ||
                      document.querySelector('.filesize')?.textContent?.trim();

      return [{
        filename,
        fileSize,
        url: window.location.href
      }];
    } catch (error) {
      console.error('Parse file info failed:', error);
      return [];
    }
  }

  /**
   * 获取直链
   */
  async getDirectLink(fileInfo) {
    try {
      // 方法1: 从页面脚本中提取
      const link = await this.extractFromScript();
      if (link) return link;

      // 方法2: 点击下载按钮触发
      const link2 = await this.extractFromDownloadButton();
      if (link2) return link2;

      // 方法3: 通过API请求
      const link3 = await this.extractFromApi();
      if (link3) return link3;

      throw new Error('无法获取下载链接');
    } catch (error) {
      console.error('Get direct link failed:', error);
      throw error;
    }
  }

  /**
   * 从页面脚本提取下载链接
   */
  async extractFromScript() {
    try {
      const scripts = document.querySelectorAll('script');

      for (const script of scripts) {
        const content = script.textContent || '';

        // 匹配下载链接
        const urlMatch = content.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/);
        if (urlMatch) {
          return urlMatch[1];
        }

        // 匹配ajax请求
        const ajaxMatch = content.match(/ajax\s*\(\s*\{[^}]*url\s*:\s*['"]([^'"]+)['"]/);
        if (ajaxMatch) {
          return this.getDownloadFromAjax(ajaxMatch[1]);
        }
      }
    } catch (error) {
      console.error('Extract from script failed:', error);
    }

    return null;
  }

  /**
   * 从下载按钮提取
   */
  async extractFromDownloadButton() {
    try {
      // 等待下载按钮
      const downloadBtn = await waitForElement('.downbtn, .down, #down, #subBtn', 5000);

      if (downloadBtn) {
        // 获取按钮的onclick或href属性
        const href = downloadBtn.getAttribute('href');
        if (href && href.startsWith('http')) {
          return href;
        }

        // 模拟点击并捕获请求
        return new Promise((resolve, reject) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name.includes('down') || entry.name.includes('file')) {
                observer.disconnect();
                resolve(entry.name);
              }
            }
          });

          observer.observe({ entryTypes: ['resource'] });

          downloadBtn.click();

          setTimeout(() => {
            observer.disconnect();
            reject(new Error('Download link not captured'));
          }, 5000);
        });
      }
    } catch (error) {
      console.error('Extract from button failed:', error);
    }

    return null;
  }

  /**
   * 通过AJAX API获取
   */
  async extractFromApi() {
    try {
      // 获取页面中的sign和其他参数
      const ajaxdata = this.parseAjaxData();
      if (!ajaxdata) {
        return null;
      }

      const response = await this.crossOriginRequest(
        ajaxdata.url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: new URLSearchParams(ajaxdata.data).toString()
        }
      );

      const data = await response.json();

      if (data.zt === 1 || data.zt === '1') {
        // 拼接完整下载地址
        const domain = data.dom || window.location.origin;
        const url = data.url || data.inf;

        if (url) {
          return url.startsWith('http') ? url : `${domain}${url}`;
        }
      }
    } catch (error) {
      console.error('Extract from API failed:', error);
    }

    return null;
  }

  /**
   * 解析页面中的AJAX数据
   */
  parseAjaxData() {
    try {
      const scripts = document.querySelectorAll('script');

      for (const script of scripts) {
        const content = script.textContent || '';

        // 查找ajax调用
        const ajaxMatch = content.match(/\$\.ajax\s*\(\s*\{([^}]+)\}/s);
        if (ajaxMatch) {
          const ajaxContent = ajaxMatch[1];

          // 提取URL
          const urlMatch = ajaxContent.match(/url\s*:\s*['"]([^'"]+)['"]/);

          // 提取data参数
          const dataMatch = ajaxContent.match(/data\s*:\s*\{([^}]+)\}/);

          if (urlMatch && dataMatch) {
            const url = urlMatch[1];
            const dataStr = dataMatch[1];

            // 解析data对象
            const data = {};
            const pairs = dataStr.split(',');

            for (const pair of pairs) {
              const [key, value] = pair.split(':').map(s => s.trim());
              if (key && value) {
                const cleanKey = key.replace(/['"]/g, '');
                const cleanValue = value.replace(/['"]/g, '');

                // 如果value是变量,尝试从全局获取
                if (!value.startsWith("'") && !value.startsWith('"')) {
                  const scriptVarMatch = content.match(new RegExp(`var\\s+${cleanValue}\\s*=\\s*['"]([^'"]+)['"]`));
                  if (scriptVarMatch) {
                    data[cleanKey] = scriptVarMatch[1];
                  }
                } else {
                  data[cleanKey] = cleanValue;
                }
              }
            }

            return { url, data };
          }
        }
      }
    } catch (error) {
      console.error('Parse ajax data failed:', error);
    }

    return null;
  }

  /**
   * 从AJAX URL获取下载链接
   */
  async getDownloadFromAjax(ajaxUrl) {
    try {
      const response = await this.crossOriginRequest(ajaxUrl, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (data.url || data.inf) {
        const url = data.url || data.inf;
        const domain = data.dom || window.location.origin;
        return url.startsWith('http') ? url : `${domain}${url}`;
      }
    } catch (error) {
      console.error('Get download from ajax failed:', error);
    }

    return null;
  }
}
