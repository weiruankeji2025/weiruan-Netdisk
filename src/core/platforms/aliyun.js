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
      // 从分享页面获取
      const shareId = this.getShareId();
      if (shareId) {
        console.log('检测到阿里云盘分享页面，Share ID:', shareId);

        // 确保有 shareToken
        await this.ensureShareToken(shareId);

        return this.getShareFileList(shareId);
      }

      // 从页面全局变量获取（个人网盘）
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
    } catch (error) {
      console.error('Parse file info failed:', error);
    }

    return [];
  }

  /**
   * 确保有 shareToken
   */
  async ensureShareToken(shareId) {
    // 检查是否已有 shareToken
    let shareToken = localStorage.getItem('shareToken');

    if (!shareToken) {
      console.log('未找到 shareToken，正在获取...');
      shareToken = await this.getShareToken(shareId);

      if (!shareToken) {
        throw new Error('无法获取分享Token，请确保分享链接有效');
      }
    }

    return shareToken;
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
      const shareToken = localStorage.getItem('shareToken');
      console.log('正在获取分享文件列表...', { shareId, hasToken: !!shareToken });

      if (!shareToken) {
        throw new Error('缺少 shareToken，无法获取文件列表');
      }

      const response = await this.crossOriginRequest(
        `${this.apiBase}/adrive/v3/file/list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Share-Token': shareToken,
            'Referer': 'https://www.aliyundrive.com/',
            'Origin': 'https://www.aliyundrive.com',
            'User-Agent': navigator.userAgent
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
      console.log('文件列表 API 响应:', data);

      if (data.items && data.items.length > 0) {
        console.log(`✅ 获取到 ${data.items.length} 个文件/文件夹`);
        return data.items.map(file => ({
          fileId: file.file_id,
          fileName: file.name,
          fileSize: file.size,
          type: file.type,
          shareId: shareId
        }));
      }

      if (data.code) {
        console.error('API 返回错误:', data.code, data.message);
      }
    } catch (error) {
      console.error('Get share file list failed:', error);
      throw error;
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
      const token = this.getToken();
      const shareToken = localStorage.getItem('shareToken');

      if (!token) {
        console.warn('No token found');
        return null;
      }

      // 如果是分享文件
      if (fileInfo.shareId) {
        return this.getShareDownloadUrl(fileInfo, shareToken);
      }

      // 个人文件 - 使用 v2 API (更稳定)
      const response = await this.crossOriginRequest(
        `${this.apiBase}/v2/file/get_download_url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Referer': 'https://www.aliyundrive.com/',
            'Origin': 'https://www.aliyundrive.com'
          },
          body: JSON.stringify({
            drive_id: fileInfo.driveId,
            file_id: fileInfo.fileId,
            expire_sec: 14400 // 4小时有效期
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
   * 获取认证 token
   */
  getToken() {
    // 方法1: 从 cookie 获取
    const cookieToken = getCookie('token');
    if (cookieToken) {
      return cookieToken;
    }

    // 方法2: 从 localStorage 获取
    const localToken = localStorage.getItem('token');
    if (localToken) {
      return localToken;
    }

    // 方法3: 尝试从全局变量获取
    if (window.__store__) {
      try {
        const state = window.__store__.getState();
        const token = state?.user?.token?.access_token;
        if (token) {
          return token;
        }
      } catch (e) {
        console.warn('Failed to get token from store:', e);
      }
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
      console.log('正在获取 shareToken...', { shareId, hasPwd: !!sharePwd });

      const response = await this.crossOriginRequest(
        `${this.apiBase}/v2/share_link/get_share_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://www.aliyundrive.com/',
            'Origin': 'https://www.aliyundrive.com',
            'User-Agent': navigator.userAgent
          },
          body: JSON.stringify({
            share_id: shareId,
            share_pwd: sharePwd
          })
        }
      );

      const data = await response.json();
      console.log('获取 shareToken 响应:', data);

      if (data.share_token) {
        localStorage.setItem('shareToken', data.share_token);
        console.log('✅ shareToken 已保存');
        return data.share_token;
      }

      // 检查是否需要密码
      if (data.code === 'ShareLinkTokenInvalid') {
        throw new Error('分享链接无效或已过期');
      }

      if (data.code === 'InvalidParameter.SharePwd') {
        throw new Error('需要提取码，请在页面上输入提取码后重试');
      }
    } catch (error) {
      console.error('Get share token failed:', error);
      throw error;
    }

    return null;
  }
}
