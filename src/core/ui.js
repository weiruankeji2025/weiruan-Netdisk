/**
 * 网盘直链下载工具 - UI组件
 */

import { UI_CONFIG } from './constants.js';

export class DownloadUI {
  constructor(downloader) {
    this.downloader = downloader;
    this.buttonContainer = null;
    this.init();
  }

  /**
   * 初始化UI
   */
  init() {
    this.injectStyles();
    this.createDownloadButton();
  }

  /**
   * 注入样式
   */
  injectStyles() {
    if (document.getElementById('netdisk-downloader-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'netdisk-downloader-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      .netdisk-download-btn {
        ${UI_CONFIG.BUTTON_STYLE}
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .netdisk-download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .netdisk-download-btn:active {
        transform: translateY(0);
      }

      .netdisk-download-btn.loading {
        pointer-events: none;
        opacity: 0.7;
      }

      .netdisk-download-btn .icon {
        width: 16px;
        height: 16px;
      }

      .netdisk-download-btn.loading .icon {
        animation: pulse 1.5s ease-in-out infinite;
      }

      .netdisk-batch-download-btn {
        ${UI_CONFIG.BUTTON_STYLE}
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        margin: 0 8px;
      }

      .netdisk-batch-download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
      }

      .netdisk-settings-btn {
        ${UI_CONFIG.BUTTON_STYLE}
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        padding: 6px 12px;
        font-size: 12px;
      }

      .netdisk-toast {
        ${UI_CONFIG.TOAST_STYLE}
      }

      .netdisk-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }

      .netdisk-modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .netdisk-modal-header {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #333;
      }

      .netdisk-modal-body {
        margin-bottom: 16px;
      }

      .netdisk-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .netdisk-file-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .netdisk-file-item {
        padding: 12px;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .netdisk-file-item:hover {
        background: #f5f5f5;
      }

      .netdisk-file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #333;
      }

      .netdisk-file-size {
        color: #999;
        font-size: 12px;
        margin-left: 12px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 创建下载按钮
   */
  createDownloadButton() {
    // 根据不同平台插入到不同位置
    const platform = this.downloader.platform;
    let targetSelector = '';

    switch (platform.key) {
      case 'BAIDU':
        targetSelector = '.wp-s-pan-title__main, .tcuLAu, .nd-main-operate';
        break;
      case 'TIANYI':
        targetSelector = '.cloud-header-right, .btns-tool';
        break;
      case 'LANZOU':
        targetSelector = '.fileinfo, .md, .file-info';
        break;
      case 'ALIYUN':
        targetSelector = '.header-right--pEOU2, .nav-bar--rBjWr';
        break;
      case 'WEIYUN':
        targetSelector = '.top-operate, .mod-operate';
        break;
      case 'QUARK':
        targetSelector = '.header-btn-group, [class*="CommonHeader--right"], header';
        break;
      default:
        targetSelector = 'body';
    }

    const observer = new MutationObserver(() => {
      const target = document.querySelector(targetSelector);
      if (target && !this.buttonContainer) {
        this.insertButton(target);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 如果已经存在目标元素,直接插入
    const target = document.querySelector(targetSelector);
    if (target) {
      this.insertButton(target);
    }
  }

  /**
   * 插入按钮
   */
  insertButton(target) {
    const container = document.createElement('div');
    container.style.display = 'inline-block';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'netdisk-download-btn';
    downloadBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M505.6 736c-9.6 0-19.2-3.2-25.6-9.6l-224-224c-12.8-12.8-12.8-32 0-44.8 12.8-12.8 32-12.8 44.8 0l204.8 204.8 204.8-204.8c12.8-12.8 32-12.8 44.8 0 12.8 12.8 12.8 32 0 44.8l-224 224c-6.4 6.4-16 9.6-25.6 9.6z"/>
        <path d="M505.6 736c-19.2 0-32-12.8-32-32V192c0-19.2 12.8-32 32-32s32 12.8 32 32v512c0 19.2-12.8 32-32 32z"/>
        <path d="M832 832H192c-19.2 0-32-12.8-32-32s12.8-32 32-32h640c19.2 0 32 12.8 32 32s-12.8 32-32 32z"/>
      </svg>
      <span>直链下载</span>
    `;

    downloadBtn.addEventListener('click', () => this.handleDownload());

    container.appendChild(downloadBtn);
    target.insertBefore(container, target.firstChild);

    this.buttonContainer = container;
  }

  /**
   * 处理下载
   */
  async handleDownload() {
    const btn = this.buttonContainer.querySelector('.netdisk-download-btn');
    btn.classList.add('loading');
    btn.querySelector('span').textContent = '获取中...';

    try {
      const files = await this.downloader.parseFileInfo();

      if (files.length === 0) {
        throw new Error('未找到文件,请选择文件后重试');
      }

      if (files.length === 1) {
        // 单文件直接下载
        await this.downloader.download(files[0]);
      } else {
        // 多文件显示列表
        this.showFileList(files);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      btn.classList.remove('loading');
      btn.querySelector('span').textContent = '直链下载';
    }
  }

  /**
   * 显示文件列表
   */
  showFileList(files) {
    const modal = document.createElement('div');
    modal.className = 'netdisk-modal';

    modal.innerHTML = `
      <div class="netdisk-modal-content">
        <div class="netdisk-modal-header">选择要下载的文件 (${files.length})</div>
        <div class="netdisk-modal-body">
          <ul class="netdisk-file-list">
            ${files.map((file, index) => `
              <li class="netdisk-file-item" data-index="${index}">
                <span class="netdisk-file-name">${file.filename || file.fileName || '未知文件'}</span>
                <span class="netdisk-file-size">${this.formatSize(file.size || file.fileSize || 0)}</span>
                <button class="netdisk-download-btn" style="margin: 0; padding: 4px 12px; font-size: 12px;">
                  下载
                </button>
              </li>
            `).join('')}
          </ul>
        </div>
        <div class="netdisk-modal-footer">
          <button class="netdisk-batch-download-btn">批量下载全部</button>
          <button class="netdisk-settings-btn">关闭</button>
        </div>
      </div>
    `;

    // 单个文件下载
    modal.querySelectorAll('.netdisk-file-item button').forEach((btn, index) => {
      btn.addEventListener('click', async () => {
        btn.textContent = '下载中...';
        btn.disabled = true;
        await this.downloader.download(files[index]);
        btn.textContent = '已完成';
      });
    });

    // 批量下载
    modal.querySelector('.netdisk-batch-download-btn').addEventListener('click', async () => {
      const batchBtn = modal.querySelector('.netdisk-batch-download-btn');
      batchBtn.textContent = '下载中...';
      batchBtn.disabled = true;
      await this.downloader.batchDownload(files);
      batchBtn.textContent = '已完成';
    });

    // 关闭
    modal.querySelector('.netdisk-settings-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * 格式化文件大小
   */
  formatSize(bytes) {
    if (!bytes || bytes === 0) return '未知大小';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 显示错误
   */
  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'netdisk-toast';
    toast.style.backgroundColor = '#ff4d4f';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
