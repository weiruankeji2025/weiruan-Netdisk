/**
 * 网盘直链下载工具 - 常量定义
 * 支持的网盘平台配置
 */

export const SUPPORTED_PLATFORMS = {
  BAIDU: {
    name: '百度网盘',
    domain: 'pan.baidu.com',
    patterns: [
      /^https?:\/\/(pan|yun)\.baidu\.com/,
      /^https?:\/\/pan\.baidu\.com\/s\//
    ],
    color: '#2932E1'
  },
  TIANYI: {
    name: '天翼云盘',
    domain: 'cloud.189.cn',
    patterns: [
      /^https?:\/\/(cloud|c)\.189\.cn/
    ],
    color: '#0B8FE8'
  },
  LANZOU: {
    name: '蓝奏云',
    domain: 'lanzou.com',
    patterns: [
      /^https?:\/\/[a-z0-9-]+\.lanzou[a-z]\.com/,
      /^https?:\/\/[a-z0-9-]+\.lanzoui\.com/,
      /^https?:\/\/[a-z0-9-]+\.lanzoux\.com/
    ],
    color: '#1296DB'
  },
  ALIYUN: {
    name: '阿里云盘',
    domain: 'aliyundrive.com',
    patterns: [
      /^https?:\/\/(www\.)?aliyundrive\.com/,
      /^https?:\/\/(www\.)?alipan\.com/
    ],
    color: '#FF6A00'
  },
  WEIYUN: {
    name: '微云',
    domain: 'weiyun.com',
    patterns: [
      /^https?:\/\/(www\.)?weiyun\.com/,
      /^https?:\/\/share\.weiyun\.com/
    ],
    color: '#00A4FF'
  },
  XUNLEI: {
    name: '迅雷云盘',
    domain: 'pan.xunlei.com',
    patterns: [
      /^https?:\/\/pan\.xunlei\.com/
    ],
    color: '#00A6FF'
  },
  QUARK: {
    name: '夸克网盘',
    domain: 'pan.quark.cn',
    patterns: [
      /^https?:\/\/pan\.quark\.cn/
    ],
    color: '#7C5CFF'
  },
  ONEDRIVE: {
    name: 'OneDrive',
    domain: 'onedrive.live.com',
    patterns: [
      /^https?:\/\/onedrive\.live\.com/,
      /^https?:\/\/.*-my\.sharepoint\.com/
    ],
    color: '#0078D4'
  }
};

export const DOWNLOAD_CONFIG = {
  // 最大重试次数
  MAX_RETRIES: 3,
  // 请求超时时间 (毫秒)
  TIMEOUT: 30000,
  // 分块下载大小 (字节)
  CHUNK_SIZE: 1024 * 1024 * 10, // 10MB
  // 最大并发下载数
  MAX_CONCURRENT: 3
};

export const UI_CONFIG = {
  // 按钮样式
  BUTTON_STYLE: `
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `,
  // 提示框样式
  TOAST_STYLE: `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `
};

export const STORAGE_KEYS = {
  SETTINGS: 'netdisk_downloader_settings',
  HISTORY: 'netdisk_downloader_history',
  STATISTICS: 'netdisk_downloader_stats'
};
