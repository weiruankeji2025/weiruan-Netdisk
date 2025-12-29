/**
 * 天翼云盘下载器
 */

import { BaseDownloader } from '../downloader.js';
import { getCookie } from '../utils.js';

export class TianyiDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
    this.apiBase = 'https://cloud.189.cn';
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    try {
      // 从页面获取分享码和文件ID
      const shareCode = this.getShareCode();
      if (shareCode) {
        return this.parseSharePage(shareCode);
      }

      // 个人网盘页面
      return this.parsePersonalPage();
    } catch (error) {
      console.error('Parse file info failed:', error);
      return [];
    }
  }

  /**
   * 获取分享码
   */
  getShareCode() {
    const match = window.location.pathname.match(/\/web\/share\/(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * 解析分享页面
   */
  async parseSharePage(shareCode) {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/api/open/share/getShareInfoByCode.action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: `shareCode=${shareCode}`
        }
      );

      const data = await response.json();
      if (data.res_code === 0 && data.fileListAO) {
        return data.fileListAO.map(file => ({
          fileId: file.fileId,
          fileName: file.fileName,
          fileSize: file.fileSize,
          isFolder: file.isFolder,
          filePath: file.filePath
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
    // 从全局变量获取
    if (window.fileList && Array.isArray(window.fileList)) {
      return window.fileList.map(file => ({
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        isFolder: file.isFolder
      }));
    }

    return [];
  }

  /**
   * 获取直链
   */
  async getDirectLink(fileInfo) {
    try {
      // 获取下载链接
      const downloadUrl = await this.getDownloadUrl(fileInfo);
      if (!downloadUrl) {
        throw new Error('无法获取下载链接');
      }

      return downloadUrl;
    } catch (error) {
      console.error('Get direct link failed:', error);
      throw error;
    }
  }

  /**
   * 获取下载URL
   */
  async getDownloadUrl(fileInfo) {
    const shareCode = this.getShareCode();

    if (shareCode) {
      // 分享文件下载
      return this.getShareDownloadUrl(shareCode, fileInfo);
    } else {
      // 个人文件下载
      return this.getPersonalDownloadUrl(fileInfo);
    }
  }

  /**
   * 获取分享文件下载链接
   */
  async getShareDownloadUrl(shareCode, fileInfo) {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/api/open/share/getShareDownloadUrl.action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: `shareCode=${shareCode}&fileId=${fileInfo.fileId}`
        }
      );

      const data = await response.json();
      if (data.res_code === 0 && data.fileDownloadUrl) {
        return data.fileDownloadUrl;
      }
    } catch (error) {
      console.error('Get share download url failed:', error);
    }

    return null;
  }

  /**
   * 获取个人文件下载链接
   */
  async getPersonalDownloadUrl(fileInfo) {
    try {
      const sessionKey = getCookie('sessionKey');

      const response = await this.crossOriginRequest(
        `${this.apiBase}/api/portal/getFileDownloadUrl.action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'SessionKey': sessionKey
          },
          body: `fileId=${fileInfo.fileId}`
        }
      );

      const data = await response.json();
      if (data.res_code === 0 && data.fileDownloadUrl) {
        return data.fileDownloadUrl;
      }
    } catch (error) {
      console.error('Get personal download url failed:', error);
    }

    return null;
  }

  /**
   * 获取访问码 (如果需要)
   */
  async getAccessCode(shareCode, accessCode) {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/api/open/share/checkAccessCode.action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `shareCode=${shareCode}&accessCode=${accessCode}`
        }
      );

      const data = await response.json();
      return data.res_code === 0;
    } catch (error) {
      console.error('Check access code failed:', error);
      return false;
    }
  }
}
