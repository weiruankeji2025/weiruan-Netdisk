/**
 * 阿里云盘下载器
 */

import { BaseDownloader } from '../downloader.js';
import { getCookie } from '../utils.js';

export class AliyunDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
    this.apiBase = 'https://api.aliyundrive.com';
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    try {
      // 从页面全局变量获取
      if (window.__store__) {
        const state = window.__store__.getState();
        const files = state?.fileList?.items || [];

        return files.map(file => ({
          fileId: file.file_id,
          fileName: file.name,
          fileSize: file.size,
          type: file.type,
          driveId: file.drive_id,
          shareId: file.share_id
        }));
      }

      // 从分享页面获取
      const shareId = this.getShareId();
      if (shareId) {
        return this.getShareFileList(shareId);
      }
    } catch (error) {
      console.error('Parse file info failed:', error);
    }

    return [];
  }

  /**
   * 获取分享ID
   */
  getShareId() {
    const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * 获取分享文件列表
   */
  async getShareFileList(shareId) {
    try {
      const token = getCookie('token') || localStorage.getItem('token');

      const response = await this.crossOriginRequest(
        `${this.apiBase}/adrive/v3/file/list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            share_id: shareId,
            parent_file_id: 'root',
            limit: 100,
            order_by: 'name',
            order_direction: 'ASC'
          })
        }
      );

      const data = await response.json();
      if (data.items) {
        return data.items.map(file => ({
          fileId: file.file_id,
          fileName: file.name,
          fileSize: file.size,
          type: file.type,
          shareId: shareId
        }));
      }
    } catch (error) {
      console.error('Get share file list failed:', error);
    }

    return [];
  }

  /**
   * 获取直链
   */
  async getDirectLink(fileInfo) {
    try {
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
    try {
      const token = getCookie('token') || localStorage.getItem('token');
      const shareToken = localStorage.getItem('shareToken');

      // 如果是分享文件
      if (fileInfo.shareId) {
        return this.getShareDownloadUrl(fileInfo, shareToken);
      }

      // 个人文件
      const response = await this.crossOriginRequest(
        `${this.apiBase}/v2/file/get_download_url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            drive_id: fileInfo.driveId,
            file_id: fileInfo.fileId
          })
        }
      );

      const data = await response.json();
      if (data.url) {
        return data.url;
      }
    } catch (error) {
      console.error('Get download url failed:', error);
    }

    return null;
  }

  /**
   * 获取分享文件下载链接
   */
  async getShareDownloadUrl(fileInfo, shareToken) {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/v2/file/get_share_link_download_url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Share-Token': shareToken
          },
          body: JSON.stringify({
            share_id: fileInfo.shareId,
            file_id: fileInfo.fileId
          })
        }
      );

      const data = await response.json();
      if (data.download_url) {
        return data.download_url;
      }
    } catch (error) {
      console.error('Get share download url failed:', error);
    }

    return null;
  }

  /**
   * 获取分享令牌
   */
  async getShareToken(shareId, sharePwd = '') {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/v2/share_link/get_share_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            share_id: shareId,
            share_pwd: sharePwd
          })
        }
      );

      const data = await response.json();
      if (data.share_token) {
        localStorage.setItem('shareToken', data.share_token);
        return data.share_token;
      }
    } catch (error) {
      console.error('Get share token failed:', error);
    }

    return null;
  }
}
