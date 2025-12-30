// ==UserScript==
// @name         网盘直链下载增强工具
// @namespace    https://github.com/weiruankeji/weiruan-Netdisk
// @version      1.3.2
// @description  支持百度网盘、天翼云盘、蓝奏云、阿里云盘、微云、夸克网盘等主流网盘的直链下载,适配18+浏览器
// @author       WeiRuan
// @match        *://pan.baidu.com/*
// @match        *://yun.baidu.com/*
// @match        *://cloud.189.cn/*
// @match        *://c.189.cn/*
// @match        *://*.lanzou*.com/*
// @match        *://*.lanzoui.com/*
// @match        *://*.lanzoux.com/*
// @match        *://www.aliyundrive.com/*
// @match        *://www.alipan.com/*
// @match        *://www.weiyun.com/*
// @match        *://share.weiyun.com/*
// @match        *://pan.xunlei.com/*
// @match        *://pan.quark.cn/*
// @match        *://drive-pc.quark.cn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      pan.baidu.com
// @connect      pcs.baidu.com
// @connect      cloud.189.cn
// @connect      aliyundrive.com
// @connect      alipan.com
// @connect      weiyun.com
// @connect      pan.quark.cn
// @connect      drive-pc.quark.cn
// @connect      *
// @run-at       document-end
// @license      MIT
// @compatible   chrome 所有基于Chromium的浏览器
// @compatible   firefox Firefox浏览器
// @compatible   edge Microsoft Edge浏览器
// @compatible   safari Safari浏览器
// @compatible   opera Opera浏览器
// ==/UserScript==

(function() {
    'use strict';

    // ============ 常量定义 ============
    const SUPPORTED_PLATFORMS = {
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
        QUARK: {
            name: '夸克网盘',
            domain: 'pan.quark.cn',
            patterns: [
                /^https?:\/\/pan\.quark\.cn/,
                /^https?:\/\/drive-pc\.quark\.cn/
            ],
            color: '#7C5CFF'
        }
    };

    // ============ 工具函数 ============
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: '#52c41a',
            error: '#ff4d4f',
            warning: '#faad14',
            info: '#1890ff'
        };

        toast.style.cssText = `
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
            background-color: ${colors[type] || colors.info};
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function getCookie(name) {
        const cookies = {};
        document.cookie.split(';').forEach(cookie => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
                cookies[key] = decodeURIComponent(value);
            }
        });
        return cookies[name] || '';
    }

    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found: ' + selector));
            }, timeout);
        });
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '未知大小';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function crossOriginRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body,
                timeout: 30000,
                responseType: options.responseType || 'text',
                onload: (response) => {
                    console.log(`[请求] ${options.method || 'GET'} ${url} - 状态: ${response.status}`);

                    if (response.status >= 400) {
                        console.error(`[请求失败] ${url}`, {
                            status: response.status,
                            statusText: response.statusText,
                            response: response.responseText?.substring(0, 500)
                        });
                    }

                    resolve({
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.responseHeaders,
                        text: () => Promise.resolve(response.responseText),
                        json: () => {
                            try {
                                return Promise.resolve(JSON.parse(response.responseText));
                            } catch (e) {
                                console.error('[JSON解析失败]', response.responseText?.substring(0, 200));
                                return Promise.reject(new Error('Invalid JSON response'));
                            }
                        }
                    });
                },
                onerror: (error) => {
                    console.error(`[请求错误] ${url}`, error);
                    reject(new Error(`请求失败: ${error.message || '网络错误'}`));
                },
                ontimeout: () => {
                    console.error(`[请求超时] ${url}`);
                    reject(new Error('请求超时，请检查网络连接'));
                }
            });
        });
    }

    // ============ 下载器基类 ============
    class BaseDownloader {
        constructor(platform) {
            this.platform = platform;
        }

        async download(fileInfo) {
            try {
                showToast(`正在获取${this.platform.name}直链...`, 'info');

                const directLink = await this.getDirectLink(fileInfo);
                if (!directLink) {
                    throw new Error('无法获取直链地址');
                }

                const filename = fileInfo.filename || fileInfo.fileName || 'download';
                showToast(`开始下载: ${filename}`, 'success');

                this.triggerBrowserDownload(directLink, filename);

                return { success: true, filename, url: directLink };
            } catch (error) {
                console.error('Download failed:', error);
                showToast(`下载失败: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        }

        triggerBrowserDownload(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || '';
            a.target = '_blank';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
        }

        async batchDownload(fileList) {
            const results = [];
            for (const file of fileList) {
                const result = await this.download(file);
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return results;
        }
    }

    // ============ 百度网盘下载器 ============
    class BaiduDownloader extends BaseDownloader {
        async parseFileInfo() {
            if (window.location.href.includes('/s/')) {
                const yunData = window.locals?.mset || window.yunData;
                if (yunData && yunData.file_list) {
                    return yunData.file_list.map(file => ({
                        fs_id: file.fs_id,
                        filename: file.server_filename,
                        size: file.size,
                        path: file.path
                    }));
                }
            } else {
                const selectedFiles = window.yunData?.selectedList || [];
                if (selectedFiles.length > 0) {
                    return selectedFiles;
                }
                return window.yunData?.fileList || [];
            }
            return [];
        }

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
                if (match) return match[1];
            }
            // 方法4: 从 cookie 获取 STOKEN
            const stoken = getCookie('STOKEN');
            if (stoken) return stoken;
            return null;
        }

        async getDirectLink(fileInfo) {
            console.log('[百度网盘] 开始获取直链', fileInfo);

            // 方法1: 使用官方下载API
            try {
                const bdstoken = this.getBdstoken();
                if (!bdstoken) {
                    console.warn('[百度网盘] 未找到 bdstoken');
                } else {
                    console.log('[百度网盘] 找到 bdstoken:', bdstoken.substring(0, 10) + '...');

                    const params = new URLSearchParams({
                        type: 'dlink',
                        fidlist: `[${fileInfo.fs_id}]`,
                        bdstoken: bdstoken
                    });

                    const response = await crossOriginRequest(
                        `https://pan.baidu.com/api/download?${params}`,
                        {
                            method: 'GET',
                            headers: {
                                'User-Agent': navigator.userAgent,
                                'Accept': 'application/json, text/javascript, */*; q=0.01',
                                'Accept-Language': 'zh-CN,zh;q=0.9',
                                'Cookie': document.cookie,
                                'Referer': window.location.href,
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        }
                    );

                    const data = await response.json();
                    console.log('[百度网盘] API响应:', data);

                    if (data.errno === 0 && data.dlink) {
                        console.log('[百度网盘] ✅ 成功获取直链');
                        return data.dlink;
                    } else {
                        console.warn('[百度网盘] API返回错误:', data.errno, data.errmsg || data.error_msg);
                    }
                }
            } catch (e) {
                console.error('[百度网盘] 官方API失败:', e);
            }

            // 方法2: 尝试使用分享链接API（如果是分享页面）
            if (window.location.href.includes('/s/')) {
                try {
                    return await this.getShareDownloadLink(fileInfo);
                } catch (e) {
                    console.error('[百度网盘] 分享链接API失败:', e);
                }
            }

            throw new Error('百度网盘：所有获取直链方法均失败，请检查登录状态或文件权限');
        }

        async getShareDownloadLink(fileInfo) {
            const shareId = window.location.pathname.match(/\/s\/(.+)/)?.[1];
            if (!shareId) {
                throw new Error('无法获取分享ID');
            }

            const response = await crossOriginRequest(
                'https://pan.baidu.com/share/download',
                {
                    method: 'POST',
                    headers: {
                        'User-Agent': navigator.userAgent,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Cookie': document.cookie,
                        'Referer': window.location.href
                    },
                    body: new URLSearchParams({
                        sign: window.yunData?.sign || '',
                        timestamp: window.yunData?.timestamp || Date.now(),
                        fid_list: `[${fileInfo.fs_id}]`,
                        share_id: shareId
                    }).toString()
                }
            );

            const data = await response.json();
            if (data.errno === 0 && data.dlink) {
                return data.dlink;
            }

            throw new Error('分享链接获取失败');
        }
    }

    // ============ 天翼云盘下载器 ============
    class TianyiDownloader extends BaseDownloader {
        constructor(platform) {
            super(platform);
            this.apiBase = 'https://cloud.189.cn';

            // 天翼云盘专用请求头
            this.tianyiHeaders = {
                'User-Agent': navigator.userAgent,
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Referer': 'https://cloud.189.cn/',
                'Origin': 'https://cloud.189.cn'
            };
        }

        async parseFileInfo() {
            const shareCode = window.location.pathname.match(/\/web\/share\/(\w+)/)?.[1];
            if (shareCode) {
                const response = await crossOriginRequest(
                    `${this.apiBase}/api/open/share/getShareInfoByCode.action`,
                    {
                        method: 'POST',
                        headers: {
                            ...this.tianyiHeaders,
                            'Content-Type': 'application/x-www-form-urlencoded'
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
                        shareCode: shareCode
                    }));
                }
            }
            return [];
        }

        async getDirectLink(fileInfo) {
            console.log('[天翼云盘] 开始获取直链', fileInfo);

            try {
                // 确保有必要的参数
                if (!fileInfo.shareCode) {
                    throw new Error('缺少分享码');
                }
                if (!fileInfo.fileId) {
                    throw new Error('缺少文件ID');
                }

                const response = await crossOriginRequest(
                    `${this.apiBase}/api/open/share/getShareDownloadUrl.action`,
                    {
                        method: 'POST',
                        headers: {
                            ...this.tianyiHeaders,
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Cookie': document.cookie
                        },
                        body: `shareCode=${fileInfo.shareCode}&fileId=${fileInfo.fileId}`
                    }
                );

                const data = await response.json();
                console.log('[天翼云盘] API响应:', data);

                if (data.res_code === 0 && data.fileDownloadUrl) {
                    console.log('[天翼云盘] ✅ 成功获取直链');
                    return data.fileDownloadUrl;
                } else {
                    console.warn('[天翼云盘] API返回错误:', data.res_code, data.res_message);
                    throw new Error(`天翼云盘API错误: ${data.res_message || '未知错误'}`);
                }
            } catch (e) {
                console.error('[天翼云盘] 获取直链失败:', e);
                throw new Error(`天翼云盘：${e.message}`);
            }
        }
    }

    // ============ 蓝奏云下载器 ============
    class LanzouDownloader extends BaseDownloader {
        async parseFileInfo() {
            const filename = document.querySelector('.filethetext')?.textContent?.trim() ||
                          document.querySelector('.b')?.textContent?.trim() ||
                          document.title;

            const fileSize = document.querySelector('.n_filesize')?.textContent?.trim() ||
                          document.querySelector('.filesize')?.textContent?.trim();

            return [{ filename, fileSize, url: window.location.href }];
        }

        async getDirectLink(fileInfo) {
            const ajaxData = this.parseAjaxData();
            if (!ajaxData) {
                throw new Error('无法解析下载参数');
            }

            const response = await crossOriginRequest(ajaxData.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams(ajaxData.data).toString()
            });

            const data = await response.json();
            if (data.zt === 1 || data.zt === '1') {
                const domain = data.dom || window.location.origin;
                const url = data.url || data.inf;
                if (url) {
                    return url.startsWith('http') ? url : `${domain}${url}`;
                }
            }

            throw new Error('无法获取下载链接');
        }

        parseAjaxData() {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent || '';
                const ajaxMatch = content.match(/\$\.ajax\s*\(\s*\{([^}]+)\}/s);
                if (ajaxMatch) {
                    const ajaxContent = ajaxMatch[1];
                    const urlMatch = ajaxContent.match(/url\s*:\s*['"]([^'"]+)['"]/);
                    const dataMatch = ajaxContent.match(/data\s*:\s*\{([^}]+)\}/);

                    if (urlMatch && dataMatch) {
                        const url = urlMatch[1];
                        const dataStr = dataMatch[1];
                        const data = {};
                        const pairs = dataStr.split(',');

                        for (const pair of pairs) {
                            const [key, value] = pair.split(':').map(s => s.trim());
                            if (key && value) {
                                const cleanKey = key.replace(/['"]/g, '');
                                const cleanValue = value.replace(/['"]/g, '');
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
            return null;
        }
    }

    // ============ 阿里云盘下载器 ============
    class AliyunDownloader extends BaseDownloader {
        constructor(platform) {
            super(platform);
            this.apiBase = 'https://api.aliyundrive.com';
        }

        async parseFileInfo() {
            // 检查是否为分享页面
            const isSharePage = window.location.href.includes('/s/');

            if (isSharePage) {
                // 从分享页面获取文件信息
                if (window.__store__) {
                    const state = window.__store__.getState();
                    const shareInfo = state?.share?.shareInfoModel;
                    const files = state?.share?.fileList || state?.fileList?.items || [];

                    const shareId = this.getShareId();
                    const shareToken = shareInfo?.share_token || localStorage.getItem('shareToken');

                    return files.map(file => ({
                        fileId: file.file_id,
                        fileName: file.name,
                        fileSize: file.size,
                        driveId: file.drive_id,
                        shareId: shareId,
                        shareToken: shareToken,
                        isShare: true
                    }));
                }
            } else {
                // 个人文件
                if (window.__store__) {
                    const state = window.__store__.getState();
                    const files = state?.fileList?.items || [];
                    return files.map(file => ({
                        fileId: file.file_id,
                        fileName: file.name,
                        fileSize: file.size,
                        driveId: file.drive_id,
                        isShare: false
                    }));
                }
            }
            return [];
        }

        getShareId() {
            const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
            return match ? match[1] : null;
        }

        async getDirectLink(fileInfo) {
            console.log('[阿里云盘] 开始获取直链', fileInfo);

            try {
                if (fileInfo.isShare || fileInfo.shareId) {
                    // 分享文件下载
                    return await this.getShareDownloadUrl(fileInfo);
                } else {
                    // 个人文件下载
                    return await this.getPersonalDownloadUrl(fileInfo);
                }
            } catch (e) {
                console.error('[阿里云盘] 获取直链失败:', e);
                throw e;
            }
        }

        async getPersonalDownloadUrl(fileInfo) {
            console.log('[阿里云盘] 使用个人文件API');

            const token = getCookie('token') || localStorage.getItem('token');
            if (!token) {
                throw new Error('未找到登录Token，请先登录阿里云盘');
            }

            console.log('[阿里云盘] Token已找到');

            const response = await crossOriginRequest(
                `${this.apiBase}/v2/file/get_download_url`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Referer': 'https://www.aliyundrive.com/',
                        'Origin': 'https://www.aliyundrive.com',
                        'User-Agent': navigator.userAgent
                    },
                    body: JSON.stringify({
                        drive_id: fileInfo.driveId,
                        file_id: fileInfo.fileId,
                        expire_sec: 14400
                    })
                }
            );

            const data = await response.json();
            console.log('[阿里云盘] 个人文件API响应:', data);

            if (data.url) {
                console.log('[阿里云盘] ✅ 成功获取直链');
                return data.url;
            }

            if (data.code) {
                throw new Error(`阿里云盘API错误: ${data.message || data.code}`);
            }

            throw new Error('无法获取下载链接');
        }

        async getShareDownloadUrl(fileInfo) {
            console.log('[阿里云盘] 使用分享文件API');

            // 分享文件需要先获取 share_token
            let shareToken = fileInfo.shareToken || localStorage.getItem('shareToken');

            if (!shareToken) {
                console.log('[阿里云盘] 正在获取 shareToken...');
                shareToken = await this.getShareToken(fileInfo.shareId);
            }

            console.log('[阿里云盘] ShareToken已找到');

            const response = await crossOriginRequest(
                `${this.apiBase}/v2/file/get_share_link_download_url`,
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
                        share_id: fileInfo.shareId,
                        file_id: fileInfo.fileId,
                        expire_sec: 14400
                    })
                }
            );

            const data = await response.json();
            console.log('[阿里云盘] 分享文件API响应:', data);

            if (data.download_url) {
                console.log('[阿里云盘] ✅ 成功获取直链');
                return data.download_url;
            }

            if (data.code) {
                throw new Error(`阿里云盘API错误: ${data.message || data.code}`);
            }

            throw new Error('无法获取下载链接');
        }

        async getShareToken(shareId) {
            console.log('[阿里云盘] 获取 shareToken, shareId:', shareId);

            const response = await crossOriginRequest(
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
                        share_pwd: ''
                    })
                }
            );

            const data = await response.json();
            console.log('[阿里云盘] ShareToken API响应:', data);

            if (data.share_token) {
                localStorage.setItem('shareToken', data.share_token);
                console.log('[阿里云盘] ✅ ShareToken已保存');
                return data.share_token;
            }

            if (data.code) {
                if (data.code === 'ShareLinkTokenInvalid') {
                    throw new Error('分享链接无效或已过期');
                } else if (data.code === 'InvalidParameter.SharePwd') {
                    throw new Error('需要提取码，请在页面上输入提取码后重试');
                }
                throw new Error(`获取ShareToken失败: ${data.message || data.code}`);
            }

            throw new Error('无法获取分享令牌');
        }
    }

    // ============ 微云下载器 ============
    class WeiyunDownloader extends BaseDownloader {
        async parseFileInfo() {
            const shareData = window.g_oShareData || window.share_info;
            if (shareData && shareData.file_list) {
                const shareKey = window.location.pathname.match(/\/s\/([a-zA-Z0-9_-]+)/)?.[1];
                return shareData.file_list.map(file => ({
                    fileId: file.id,
                    fileName: file.file_name || file.name,
                    fileSize: file.file_size || file.size,
                    pDirKey: file.pdir_key,
                    shareKey: shareKey
                }));
            }
            return [];
        }

        async getDirectLink(fileInfo) {
            console.log('[微云] 开始获取直链', fileInfo);

            try {
                if (!fileInfo.shareKey) {
                    throw new Error('缺少分享Key');
                }
                if (!fileInfo.fileId) {
                    throw new Error('缺少文件ID');
                }

                const response = await crossOriginRequest(
                    'https://www.weiyun.com/webapp/share/download',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': window.location.href,
                            'Origin': 'https://www.weiyun.com',
                            'User-Agent': navigator.userAgent,
                            'Cookie': document.cookie
                        },
                        body: new URLSearchParams({
                            share_key: fileInfo.shareKey,
                            pdir_fid: fileInfo.pDirKey || '0',
                            fid: fileInfo.fileId
                        }).toString()
                    }
                );

                const data = await response.json();
                console.log('[微云] API响应:', data);

                if (data.data && data.data.download_url) {
                    console.log('[微云] ✅ 成功获取直链');
                    return data.data.download_url;
                }

                if (data.code !== 0) {
                    throw new Error(`微云API错误: ${data.msg || data.message || '未知错误'}`);
                }

                throw new Error('响应中未找到下载链接');
            } catch (e) {
                console.error('[微云] 获取直链失败:', e);
                throw new Error(`微云：${e.message}`);
            }
        }
    }

    // ============ 夸克网盘下载器 ============
    class QuarkDownloader extends BaseDownloader {
        constructor(platform) {
            super(platform);
            this.apiBase = 'https://drive-pc.quark.cn';

            // 夸克网盘专用请求头 - 模拟官方PC客户端
            this.quarkHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-update.11 Safari/537.36 Channel/pckk_other_ch',
                'Referer': 'https://pan.quark.cn/',
                'Origin': 'https://pan.quark.cn',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Content-Type': 'application/json'
            };
        }

        async parseFileInfo() {
            try {
                const shareId = this.getShareId();
                console.log('[夸克网盘] Share ID:', shareId);

                // 尝试获取更多认证信息
                const pwdId = this.getPwdId();
                const passcode = this.getPasscode();

                console.log('[夸克网盘] 认证信息:', { shareId, pwdId, passcode: passcode ? '***' : '无' });

                // 方法1: 从 DOM 提取文件信息（最可靠，优先使用）
                const domFiles = this.parseFilesFromDOM(shareId, pwdId, passcode);
                if (domFiles.length > 0) {
                    console.log(`[夸克网盘] ✅ 从 DOM 获取到 ${domFiles.length} 个文件`);
                    return domFiles;
                }

                // 方法2: 从 __INITIAL_STATE__ 获取
                if (unsafeWindow.__INITIAL_STATE__) {
                    console.log('[夸克网盘] 找到 __INITIAL_STATE__');
                    const state = unsafeWindow.__INITIAL_STATE__;
                    const files = state?.list?.list || state?.share?.list || [];

                    if (files.length > 0) {
                        console.log(`[夸克网盘] ✅ 从 __INITIAL_STATE__ 获取到 ${files.length} 个文件`);
                        return files.map(file => ({
                            fid: file.fid,
                            fileName: file.file_name || file.fileName,
                            fileSize: file.size || file.fileSize,
                            shareId: shareId,
                            pwdId: pwdId,
                            passcode: passcode
                        }));
                    }
                }

                // 方法3: 从 window.g_initialProps 获取
                if (unsafeWindow.g_initialProps) {
                    console.log('[夸克网盘] 找到 g_initialProps');
                    const props = unsafeWindow.g_initialProps;
                    const files = props?.resData?.list || props?.data?.list || [];

                    if (files.length > 0) {
                        console.log(`[夸克网盘] ✅ 从 g_initialProps 获取到 ${files.length} 个文件`);
                        return files.map(file => ({
                            fid: file.fid,
                            fileName: file.file_name || file.fileName,
                            fileSize: file.size || file.fileSize,
                            shareId: shareId,
                            pwdId: pwdId,
                            passcode: passcode
                        }));
                    }
                }

                console.warn('[夸克网盘] 所有方法都未能获取到文件列表');
            } catch (error) {
                console.error('[夸克网盘] Parse file info failed:', error);
            }
            return [];
        }

        getPwdId() {
            // 从URL获取pwd_id
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('pwd_id') || this.getShareId();
        }

        getPasscode() {
            // 尝试从页面获取提取码
            const passcodeInput = document.querySelector('input[placeholder*="提取码"]');
            if (passcodeInput && passcodeInput.value) {
                return passcodeInput.value;
            }

            // 从sessionStorage获取
            try {
                const saved = sessionStorage.getItem(`quark_passcode_${this.getShareId()}`);
                if (saved) return saved;
            } catch (e) {}

            return '';
        }

        parseFilesFromDOM(shareId, pwdId, passcode) {
            try {
                const files = [];
                const fileTable = document.querySelector('.ant-table-tbody');

                if (!fileTable) {
                    console.log('[夸克网盘] 未找到文件列表表格');
                    return [];
                }

                const rows = fileTable.querySelectorAll('tr');
                console.log(`[夸克网盘] 找到 ${rows.length} 个文件行`);

                rows.forEach((row, index) => {
                    const nameEl = row.querySelector('.filename-text') ||
                                   row.querySelector('[class*="filename"]') ||
                                   row.querySelector('span[title]');
                    const cells = row.querySelectorAll('td');

                    if (nameEl && cells.length >= 2) {
                        const fileName = nameEl.textContent.trim() || nameEl.getAttribute('title');
                        const fileSize = cells[2]?.textContent.trim() || cells[1]?.textContent.trim() || '';

                        // 跳过文件夹（显示"X项"的是文件夹）
                        if (fileSize.includes('项') || fileSize.includes('个文件')) {
                            console.log(`[夸克网盘] 跳过文件夹: ${fileName}`);
                            return;
                        }

                        // 尝试从row的data属性获取fid
                        let fid = row.getAttribute('data-row-key') ||
                                 row.getAttribute('data-fid') ||
                                 row.getAttribute('data-id');

                        // 尝试从React Fiber获取真实的fid
                        const fiberKey = Object.keys(row).find(key => key.startsWith('__react'));
                        if (fiberKey) {
                            try {
                                const fiber = row[fiberKey];
                                const rowData = fiber?.return?.memoizedProps?.record ||
                                               fiber?.memoizedProps?.record;
                                if (rowData && rowData.fid) {
                                    fid = rowData.fid;
                                    console.log(`[夸克网盘] 从React Fiber获取到fid: ${fid}`);
                                }
                            } catch (e) {
                                // 忽略错误
                            }
                        }

                        if (!fid) {
                            console.warn(`[夸克网盘] 无法获取文件 ${fileName} 的fid，跳过`);
                            return;
                        }

                        files.push({
                            fid: fid,
                            fileName: fileName,
                            fileSize: fileSize,
                            shareId: shareId,
                            pwdId: pwdId,
                            passcode: passcode
                        });

                        console.log(`[夸克网盘] 提取文件: ${fileName} (${fileSize}), fid: ${fid}`);
                    }
                });

                return files;
            } catch (error) {
                console.error('[夸克网盘] 从DOM提取文件失败:', error);
                return [];
            }
        }

        getShareId() {
            const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
            return match ? match[1] : null;
        }

        async getDirectLink(fileInfo) {
            console.log('[夸克网盘] 开始获取直链', fileInfo);

            try {
                if (!fileInfo.fid) {
                    throw new Error('缺少文件ID (fid)');
                }
                if (!fileInfo.shareId) {
                    throw new Error('缺少分享ID');
                }

                // 方法1: 尝试新版API端点
                console.log('[夸克网盘] 尝试方法1: 新版API');
                try {
                    const result = await this.getDirectLinkV2(fileInfo);
                    if (result) return result;
                } catch (e) {
                    console.warn('[夸克网盘] 方法1失败:', e.message);
                }

                // 方法2: 尝试旧版API端点
                console.log('[夸克网盘] 尝试方法2: 旧版API');
                try {
                    const result = await this.getDirectLinkV1(fileInfo);
                    if (result) return result;
                } catch (e) {
                    console.warn('[夸克网盘] 方法2失败:', e.message);
                }

                // 方法3: 尝试使用网页端API
                console.log('[夸克网盘] 尝试方法3: 网页端API');
                try {
                    const result = await this.getDirectLinkWeb(fileInfo);
                    if (result) return result;
                } catch (e) {
                    console.warn('[夸克网盘] 方法3失败:', e.message);
                }

                throw new Error('所有API端点均失败，夸克网盘可能已更新接口');
            } catch (error) {
                console.error('[夸克网盘] 获取直链失败:', error);
                throw new Error(`夸克网盘：${error.message}`);
            }
        }

        // 新版API (v2) - 先获取文件详情，再获取下载链接
        async getDirectLinkV2(fileInfo) {
            const headers = {
                ...this.quarkHeaders,
                'Cookie': document.cookie
            };

            console.log('[夸克网盘] V2方法 - 请求参数:', {
                pwd_id: fileInfo.pwdId || fileInfo.shareId,
                fid: fileInfo.fid
            });

            // 步骤1: 获取文件详情（可能需要先调用这个API）
            try {
                const detailResponse = await crossOriginRequest(
                    `https://drive-h.quark.cn/1/clouddrive/share/sharepage/detail`,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            pwd_id: fileInfo.pwdId || fileInfo.shareId,
                            passcode: fileInfo.passcode || '',
                            pdir_fid: '0',
                            _page: 1,
                            _size: 100,
                            _fetch_banner: 0,
                            _fetch_share: 1,
                            _fetch_total: 1,
                            _sort: 'file_type:asc,updated_at:desc'
                        })
                    }
                );

                const detailData = await detailResponse.json();
                console.log('[夸克网盘] V2详情响应:', detailData);

                // 步骤2: 使用详情中的信息获取下载链接
                if (detailData.data && detailData.data.share) {
                    const downloadResponse = await crossOriginRequest(
                        `https://drive-h.quark.cn/1/clouddrive/share/sharepage/download`,
                        {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                fids: [fileInfo.fid],
                                share_id: detailData.data.share.share_id || fileInfo.shareId
                            })
                        }
                    );

                    const downloadData = await downloadResponse.json();
                    console.log('[夸克网盘] V2下载响应:', downloadData);

                    if (downloadData.data && downloadData.data.length > 0) {
                        const fileData = downloadData.data[0];
                        if (fileData.download_url) {
                            console.log('[夸克网盘] ✅ V2成功获取直链');
                            return fileData.download_url;
                        }
                    }
                }
            } catch (e) {
                console.error('[夸克网盘] V2方法详细错误:', e);
            }

            return null;
        }

        // 旧版API (v1)
        async getDirectLinkV1(fileInfo) {
            const headers = {
                ...this.quarkHeaders,
                'Cookie': document.cookie
            };

            const response = await crossOriginRequest(
                `${this.apiBase}/1/clouddrive/share/sharepage/download`,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        fids: [fileInfo.fid],
                        share_id: fileInfo.shareId
                    })
                }
            );

            const data = await response.json();
            console.log('[夸克网盘] V1 API响应:', data);

            if (data.status === 200 && data.data && data.data.length > 0) {
                const fileData = data.data[0];
                if (fileData.download_url) {
                    console.log('[夸克网盘] ✅ V1成功获取直链');
                    return fileData.download_url;
                }
            }

            return null;
        }

        // 网页端API
        async getDirectLinkWeb(fileInfo) {
            const headers = {
                'User-Agent': navigator.userAgent,
                'Referer': 'https://pan.quark.cn/',
                'Origin': 'https://pan.quark.cn',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Cookie': document.cookie
            };

            const response = await crossOriginRequest(
                `https://pan.quark.cn/1/clouddrive/share/sharepage/download?pr=ucpro&fr=pc`,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        fids: [fileInfo.fid],
                        share_id: fileInfo.shareId
                    })
                }
            );

            const data = await response.json();
            console.log('[夸克网盘] Web API响应:', data);

            if (data.data && data.data.length > 0) {
                const fileData = data.data[0];
                if (fileData.download_url) {
                    console.log('[夸克网盘] ✅ Web成功获取直链');
                    return fileData.download_url;
                }
            }

            return null;
        }
    }

    // ============ 工厂类 ============
    class DownloaderFactory {
        static downloaders = {
            BAIDU: BaiduDownloader,
            TIANYI: TianyiDownloader,
            LANZOU: LanzouDownloader,
            ALIYUN: AliyunDownloader,
            WEIYUN: WeiyunDownloader,
            QUARK: QuarkDownloader
        };

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

        static createDownloader(platformKey, platform) {
            const DownloaderClass = this.downloaders[platformKey];
            if (!DownloaderClass) {
                throw new Error(`Unsupported platform: ${platformKey}`);
            }
            return new DownloaderClass(platform);
        }
    }

    // ============ UI类 ============
    class DownloadUI {
        constructor(downloader) {
            this.downloader = downloader;
            this.init();
        }

        init() {
            this.injectStyles();
            this.createDownloadButton();
        }

        injectStyles() {
            GM_addStyle(`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .netdisk-download-btn {
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    color: white;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }

                .netdisk-download-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .netdisk-download-btn .icon {
                    width: 16px;
                    height: 16px;
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
            `);
        }

        createDownloadButton() {
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

            let injected = false;
            const self = this; // 保存 this 引用

            const insertBtn = () => {
                if (injected) return; // 已注入则跳过

                const target = document.querySelector(targetSelector);
                if (target && !document.querySelector('.netdisk-download-btn')) {
                    console.log(`✅ 找到目标容器，准备注入按钮:`, targetSelector);

                    const btn = document.createElement('button');
                    btn.className = 'netdisk-download-btn';
                    btn.innerHTML = `
                        <svg class="icon" viewBox="0 0 1024 1024" fill="currentColor">
                            <path d="M505.6 736c-9.6 0-19.2-3.2-25.6-9.6l-224-224c-12.8-12.8-12.8-32 0-44.8 12.8-12.8 32-12.8 44.8 0l204.8 204.8 204.8-204.8c12.8-12.8 32-12.8 44.8 0 12.8 12.8 12.8 32 0 44.8l-224 224c-6.4 6.4-16 9.6-25.6 9.6z"/>
                            <path d="M505.6 736c-19.2 0-32-12.8-32-32V192c0-19.2 12.8-32 32-32s32 12.8 32 32v512c0 19.2-12.8 32-32 32z"/>
                            <path d="M832 832H192c-19.2 0-32-12.8-32-32s12.8-32 32-32h640c19.2 0 32 12.8 32 32s-12.8 32-32 32z"/>
                        </svg>
                        <span>直链下载</span>
                    `;
                    btn.addEventListener('click', () => self.handleDownload());
                    target.insertBefore(btn, target.firstChild);

                    injected = true;
                    console.log('✅ 按钮注入成功！');
                    if (observer) observer.disconnect();
                }
            };

            // 多次重试，增加成功率
            setTimeout(insertBtn, 500);
            setTimeout(insertBtn, 1000);
            setTimeout(insertBtn, 2000);
            setTimeout(insertBtn, 3000);

            const observer = new MutationObserver(insertBtn);
            observer.observe(document.body, { childList: true, subtree: true });
        }

        async handleDownload() {
            try {
                const files = await this.downloader.parseFileInfo();
                if (files.length === 0) {
                    throw new Error('未找到文件,请选择文件后重试');
                }

                if (files.length === 1) {
                    await this.downloader.download(files[0]);
                } else {
                    this.showFileList(files);
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        showFileList(files) {
            const modal = document.createElement('div');
            modal.className = 'netdisk-modal';
            modal.innerHTML = `
                <div class="netdisk-modal-content">
                    <h3>选择要下载的文件 (${files.length})</h3>
                    <div>
                        ${files.map((file, i) => `
                            <div class="netdisk-file-item">
                                <span class="netdisk-file-name">${file.filename || file.fileName || '未知文件'}</span>
                                <span>${formatFileSize(file.size || file.fileSize || 0)}</span>
                                <button class="netdisk-download-btn" style="margin: 0 0 0 12px; padding: 4px 12px; font-size: 12px;" data-index="${i}">下载</button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 16px; text-align: right;">
                        <button class="netdisk-download-btn" id="close-modal" style="background: #999;">关闭</button>
                    </div>
                </div>
            `;

            modal.querySelectorAll('[data-index]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const index = parseInt(e.target.dataset.index);
                    btn.textContent = '下载中...';
                    btn.disabled = true;
                    await this.downloader.download(files[index]);
                    btn.textContent = '已完成';
                });
            });

            modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });

            document.body.appendChild(modal);
        }
    }

    // ============ 主程序入口 ============
    function init() {
        const platform = DownloaderFactory.detectPlatform();
        if (!platform) {
            console.log('当前网站不支持');
            return;
        }

        console.log(`检测到平台: ${platform.name}`);

        try {
            const downloader = DownloaderFactory.createDownloader(platform.key, platform);
            new DownloadUI(downloader);
            console.log('网盘直链下载增强工具已启动');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();