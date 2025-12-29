/**
 * 百度网盘下载器
 */

import { BaseDownloader } from '../downloader.js';
import { getCookie, waitForElement } from '../utils.js';

export class BaiduDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    const files = [];

    // 判断是分享页面还是个人网盘
    if (window.location.href.includes('/s/')) {
      // 分享页面
      return this.parseSharePage();
    } else {
      // 个人网盘
      return this.parsePersonalPage();
    }
  }

  /**
   * 解析分享页面
   */
  async parseSharePage() {
    try {
      // 获取分享文件信息
      const shareId = window.location.pathname.match(/\/s\/(.+)/)?.[1];
      if (!shareId) {
        throw new Error('无法获取分享ID');
      }

      // 尝试从页面数据获取
      const yunData = window.locals?.mset || window.yunData;
      if (yunData && yunData.file_list) {
        return yunData.file_list.map(file => ({
          fs_id: file.fs_id,
          filename: file.server_filename,
          size: file.size,
          isdir: file.isdir,
          path: file.path
        }));
      }

      // 降级方案:从API获取
      const response = await this.crossOriginRequest(
        '/share/list',
        {
          method: 'GET',
          headers: {
            'User-Agent': navigator.userAgent
          }
        }
      );

      const data = await response.json();
      if (data.errno === 0 && data.list) {
        return data.list.map(file => ({
          fs_id: file.fs_id,
          filename: file.server_filename,
          size: file.size,
          isdir: file.isdir,
          path: file.path
        }));
      }
    } catch (error) {
      console.error('Parse share page failed:', error);
    }

    return [];
  }

  /**
   * 解析个人网盘页面
   */
  async parsePersonalPage() {
    try {
      // 从选中的文件列表获取
      const selectedFiles = window.yunData?.selectedList || [];
      if (selectedFiles.length > 0) {
        return selectedFiles;
      }

      // 获取当前文件列表
      const fileList = window.yunData?.fileList || [];
      return fileList;
    } catch (error) {
      console.error('Parse personal page failed:', error);
      return [];
    }
  }

  /**
   * 获取直链
   */
  async getDirectLink(fileInfo) {
    // 方法1: 使用官方API
    try {
      const link = await this.getOfficialDownloadLink(fileInfo);
      if (link) return link;
    } catch (e) {
      console.warn('Official API failed:', e);
    }

    // 方法2: 使用PCS API
    try {
      const link = await this.getPcsDownloadLink(fileInfo);
      if (link) return link;
    } catch (e) {
      console.warn('PCS API failed:', e);
    }

    throw new Error('所有获取直链方法均失败');
  }

  /**
   * 使用官方API获取下载链接
   */
  async getOfficialDownloadLink(fileInfo) {
    // 正确获取 bdstoken
    const bdstoken = this.getBdstoken();
    if (!bdstoken) {
      console.warn('No bdstoken found, trying alternative method');
      return null;
    }

    const logid = this.generateLogid();

    const params = new URLSearchParams({
      type: 'dlink',
      fidlist: `[${fileInfo.fs_id}]`,
      bdstoken: bdstoken
    });

    const response = await this.crossOriginRequest(
      `https://pan.baidu.com/api/download?${params}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': navigator.userAgent,
          'Cookie': document.cookie,
          'Referer': window.location.href
        }
      }
    );

    const data = await response.json();
    if (data.errno === 0 && data.dlink) {
      return data.dlink;
    }

    return null;
  }

  /**
   * 获取 BDSTOKEN
   */
  getBdstoken() {
    // 方法1: 从全局变量获取
    if (window.yunData && window.yunData.MYBDSTOKEN) {
      return window.yunData.MYBDSTOKEN;
    }

    // 方法2: 从 locals 变量获取
    if (window.locals && window.locals.bdstoken) {
      return window.locals.bdstoken;
    }

    // 方法3: 从页面脚本中提取
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      const match = content.match(/bdstoken["']?\s*[:=]\s*["']([^"']+)["']/i);
      if (match) {
        return match[1];
      }
    }

    // 方法4: 从 cookie 获取 STOKEN
    const stoken = getCookie('STOKEN');
    if (stoken) {
      return stoken;
    }

    return null;
  }

  /**
   * 使用PCS API获取下载链接
   */
  async getPcsDownloadLink(fileInfo) {
    const response = await this.crossOriginRequest(
      `https://pcs.baidu.com/rest/2.0/pcs/file?method=download&path=${encodeURIComponent(fileInfo.path)}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': navigator.userAgent,
          'Cookie': document.cookie
        }
      }
    );

    if (response.ok) {
      return response.url;
    }

    return null;
  }

  /**
   * 生成logid
   */
  generateLogid() {
    const randomStr = () => Math.random().toString(36).substring(2, 15);
    return `${randomStr()}${randomStr()}`;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      const response = await this.crossOriginRequest(
        'https://pan.baidu.com/api/user/getinfo',
        {
          method: 'GET',
          headers: {
            'User-Agent': navigator.userAgent,
            'Cookie': document.cookie
          }
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user info failed:', error);
      return null;
    }
  }
}
