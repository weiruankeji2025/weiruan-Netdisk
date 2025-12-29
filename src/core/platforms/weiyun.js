/**
 * 微云下载器
 */

import { BaseDownloader } from '../downloader.js';

export class WeiyunDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    try {
      // 从页面数据获取
      const shareData = window.g_oShareData || window.share_info;

      if (shareData && shareData.file_list) {
        return shareData.file_list.map(file => ({
          fileId: file.id,
          fileName: file.file_name || file.name,
          fileSize: file.file_size || file.size,
          pDirKey: file.pdir_key,
          shareKey: shareData.share_key
        }));
      }

      // 从API获取
      const shareKey = this.getShareKey();
      if (shareKey) {
        return this.getShareFileList(shareKey);
      }
    } catch (error) {
      console.error('Parse file info failed:', error);
    }

    return [];
  }

  /**
   * 获取分享key
   */
  getShareKey() {
    const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * 获取分享文件列表
   */
  async getShareFileList(shareKey) {
    try {
      const response = await this.crossOriginRequest(
        'https://www.weiyun.com/webapp/share/list',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            share_key: shareKey,
            pwd: '',
            pdir_fid: '0'
          }).toString()
        }
      );

      const data = await response.json();
      if (data.data && data.data.file_list) {
        return data.data.file_list.map(file => ({
          fileId: file.id,
          fileName: file.file_name,
          fileSize: file.file_size,
          pDirKey: file.pdir_key,
          shareKey: shareKey
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
      const response = await this.crossOriginRequest(
        'https://www.weiyun.com/webapp/share/download',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            share_key: fileInfo.shareKey,
            pdir_fid: fileInfo.pDirKey || '0',
            fid: fileInfo.fileId
          }).toString()
        }
      );

      const data = await response.json();
      if (data.data && data.data.download_url) {
        return data.data.download_url;
      }
    } catch (error) {
      console.error('Get download url failed:', error);
    }

    return null;
  }

  /**
   * 验证访问密码
   */
  async verifyPassword(shareKey, password) {
    try {
      const response = await this.crossOriginRequest(
        'https://www.weiyun.com/webapp/share/check_pwd',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            share_key: shareKey,
            pwd: password
          }).toString()
        }
      );

      const data = await response.json();
      return data.code === 0;
    } catch (error) {
      console.error('Verify password failed:', error);
      return false;
    }
  }
}
