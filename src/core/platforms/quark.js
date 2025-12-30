/**
 * 夸克网盘下载器
 */

import { BaseDownloader } from '../downloader.js';
import { getCookie } from '../utils.js';

export class QuarkDownloader extends BaseDownloader {
  constructor(platform) {
    super(platform);
    this.apiBase = 'https://drive-pc.quark.cn';

    // 夸克网盘需要的特殊headers
    this.quarkHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-update.11 Safari/537.36 Channel/pckk_other_ch',
      'Referer': 'https://pan.quark.cn/',
      'Origin': 'https://pan.quark.cn',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Content-Type': 'application/json'
    };
  }

  /**
   * 解析文件信息
   */
  async parseFileInfo() {
    try {
      // 从页面全局变量获取
      if (window.__INITIAL_STATE__) {
        const state = window.__INITIAL_STATE__;
        const files = state?.list?.list || [];

        return files.map(file => ({
          fid: file.fid,
          fileName: file.file_name,
          fileSize: file.size,
          fileType: file.file_type,
          shareId: this.getShareId()
        }));
      }

      // 从分享页面获取
      const shareId = this.getShareId();
      if (shareId) {
        return this.getShareFileList(shareId);
      }

      // 从API获取当前目录文件
      return this.getCurrentFileList();
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
   * 获取分享令牌
   */
  async getShareToken(shareId, passcode = '') {
    try {
      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/share/sharepage/token`,
        {
          method: 'POST',
          headers: this.quarkHeaders,
          body: JSON.stringify({
            pwd_id: shareId,
            passcode: passcode
          })
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.stoken) {
        return data.data.stoken;
      }
    } catch (error) {
      console.error('Get share token failed:', error);
    }

    return null;
  }

  /**
   * 获取分享文件列表
   */
  async getShareFileList(shareId) {
    try {
      const passcode = this.getPasscode();

      // 第一步：获取分享令牌
      const stoken = await this.getShareToken(shareId, passcode);
      if (!stoken) {
        throw new Error('无法获取分享令牌，请检查分享链接或密码');
      }

      // 第二步：获取文件列表
      const params = new URLSearchParams({
        pwd_id: shareId,
        stoken: stoken,
        pdir_fid: '0',
        _page: '1',
        _size: '100',
        _sort: 'file_type:asc,updated_at:desc'
      });

      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/share/sharepage/detail?${params.toString()}`,
        {
          method: 'GET',
          headers: this.quarkHeaders
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.list) {
        return data.data.list.map(file => ({
          fid: file.fid,
          fileName: file.file_name,
          fileSize: file.size,
          fileType: file.file_type,
          shareId: shareId,
          stoken: stoken,
          passcode: passcode
        }));
      }
    } catch (error) {
      console.error('Get share file list failed:', error);
    }

    return [];
  }

  /**
   * 获取当前目录文件列表
   */
  async getCurrentFileList() {
    try {
      const headers = {
        ...this.quarkHeaders,
        'Cookie': document.cookie
      };

      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/file/sort`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            pdir_fid: '0',
            _page: 1,
            _size: 100,
            _sort: 'file_type:asc,updated_at:desc'
          })
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.list) {
        return data.data.list.map(file => ({
          fid: file.fid,
          fileName: file.file_name,
          fileSize: file.size,
          fileType: file.file_type
        }));
      }
    } catch (error) {
      console.error('Get current file list failed:', error);
    }

    return [];
  }

  /**
   * 获取访问密码
   */
  getPasscode() {
    // 尝试从页面获取
    const passcodeInput = document.querySelector('input[placeholder*="密码"]');
    if (passcodeInput && passcodeInput.value) {
      return passcodeInput.value;
    }

    // 从localStorage获取
    const shareId = this.getShareId();
    if (shareId) {
      const saved = localStorage.getItem(`quark_passcode_${shareId}`);
      if (saved) {
        return saved;
      }
    }

    return '';
  }

  /**
   * 获取直链
   */
  async getDirectLink(fileInfo) {
    try {
      if (fileInfo.shareId) {
        // 分享文件下载
        return this.getShareDownloadUrl(fileInfo);
      } else {
        // 个人文件下载
        return this.getPersonalDownloadUrl(fileInfo);
      }
    } catch (error) {
      console.error('Get direct link failed:', error);
      throw error;
    }
  }

  /**
   * 获取分享文件下载链接
   */
  async getShareDownloadUrl(fileInfo) {
    try {
      // 确保有stoken
      let stoken = fileInfo.stoken;
      if (!stoken) {
        stoken = await this.getShareToken(fileInfo.shareId, fileInfo.passcode || '');
        if (!stoken) {
          throw new Error('无法获取分享令牌');
        }
      }

      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/share/sharepage/download`,
        {
          method: 'POST',
          headers: this.quarkHeaders,
          body: JSON.stringify({
            fids: [fileInfo.fid],
            pwd_id: fileInfo.shareId,
            stoken: stoken
          })
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.length > 0) {
        const fileData = data.data[0];

        // 夸克网盘返回的下载链接
        if (fileData.download_url) {
          return fileData.download_url;
        }

        // 或者返回预览链接用于下载
        if (fileData.preview_url) {
          return fileData.preview_url;
        }
      }
    } catch (error) {
      console.error('Get share download url failed:', error);
      throw error;
    }

    throw new Error('无法获取下载链接');
  }

  /**
   * 获取个人文件下载链接
   */
  async getPersonalDownloadUrl(fileInfo) {
    try {
      const headers = {
        ...this.quarkHeaders,
        'Cookie': document.cookie
      };

      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/file/download`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            fids: [fileInfo.fid]
          })
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.length > 0) {
        const fileData = data.data[0];

        if (fileData.download_url) {
          return fileData.download_url;
        }
      }
    } catch (error) {
      console.error('Get personal download url failed:', error);
    }

    throw new Error('无法获取下载链接');
  }

  /**
   * 验证分享密码
   */
  async verifyPasscode(shareId, passcode) {
    try {
      // 尝试获取token来验证密码
      const stoken = await this.getShareToken(shareId, passcode);

      if (stoken) {
        // 保存密码到localStorage
        localStorage.setItem(`quark_passcode_${shareId}`, passcode);
        return true;
      }
    } catch (error) {
      console.error('Verify passcode failed:', error);
    }

    return false;
  }

  /**
   * 获取文件详情
   */
  async getFileDetail(fid) {
    try {
      const headers = {
        ...this.quarkHeaders,
        'Cookie': document.cookie
      };

      const response = await this.crossOriginRequest(
        `${this.apiBase}/1/clouddrive/file/info`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            fids: [fid]
          })
        }
      );

      const data = await response.json();
      if (data.status === 200 && data.data && data.data.length > 0) {
        return data.data[0];
      }
    } catch (error) {
      console.error('Get file detail failed:', error);
    }

    return null;
  }
}
