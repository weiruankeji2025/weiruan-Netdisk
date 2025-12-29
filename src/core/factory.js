/**
 * 网盘下载器工厂
 */

import { SUPPORTED_PLATFORMS } from './constants.js';
import { BaiduDownloader } from './platforms/baidu.js';
import { TianyiDownloader } from './platforms/tianyi.js';
import { LanzouDownloader } from './platforms/lanzou.js';
import { AliyunDownloader } from './platforms/aliyun.js';
import { WeiyunDownloader } from './platforms/weiyun.js';

export class DownloaderFactory {
  static downloaders = {
    BAIDU: BaiduDownloader,
    TIANYI: TianyiDownloader,
    LANZOU: LanzouDownloader,
    ALIYUN: AliyunDownloader,
    WEIYUN: WeiyunDownloader
  };

  /**
   * 检测当前平台
   */
  static detectPlatform(url = window.location.href) {
    for (const [key, platform] of Object.entries(SUPPORTED_PLATFORMS)) {
      for (const pattern of platform.patterns) {
        if (pattern.test(url)) {
          return { key, ...platform };
        }
      }
    }

    return null;
  }

  /**
   * 创建下载器实例
   */
  static createDownloader(platformKey, platform) {
    const DownloaderClass = this.downloaders[platformKey];

    if (!DownloaderClass) {
      throw new Error(`Unsupported platform: ${platformKey}`);
    }

    return new DownloaderClass(platform);
  }

  /**
   * 自动创建当前平台的下载器
   */
  static createCurrentDownloader() {
    const platform = this.detectPlatform();

    if (!platform) {
      throw new Error('Current platform is not supported');
    }

    return this.createDownloader(platform.key, platform);
  }

  /**
   * 检查平台是否支持
   */
  static isSupported(url = window.location.href) {
    return this.detectPlatform(url) !== null;
  }

  /**
   * 获取所有支持的平台
   */
  static getSupportedPlatforms() {
    return Object.entries(SUPPORTED_PLATFORMS).map(([key, platform]) => ({
      key,
      ...platform
    }));
  }
}
