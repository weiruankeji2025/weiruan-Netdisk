/**
 * Chrome Extension - Content Script
 * 注入到网盘页面的脚本
 */

// 此文件包含与userscript相同的核心功能,但使用Chrome Extension API
// 为了简化,我们将直接嵌入核心代码

(function() {
    'use strict';

    // ============ 常量定义 ============
    const SUPPORTED_PLATFORMS = {
        BAIDU: {
            name: '百度网盘',
            patterns: [/^https?:\/\/(pan|yun)\.baidu\.com/],
            color: '#2932E1'
        },
        TIANYI: {
            name: '天翼云盘',
            patterns: [/^https?:\/\/(cloud|c)\.189\.cn/],
            color: '#0B8FE8'
        },
        LANZOU: {
            name: '蓝奏云',
            patterns: [
                /^https?:\/\/[a-z0-9-]+\.lanzou[a-z]\.com/,
                /^https?:\/\/[a-z0-9-]+\.lanzoui\.com/,
                /^https?:\/\/[a-z0-9-]+\.lanzoux\.com/
            ],
            color: '#1296DB'
        },
        ALIYUN: {
            name: '阿里云盘',
            patterns: [
                /^https?:\/\/(www\.)?aliyundrive\.com/,
                /^https?:\/\/(www\.)?alipan\.com/
            ],
            color: '#FF6A00'
        },
        WEIYUN: {
            name: '微云',
            patterns: [
                /^https?:\/\/(www\.)?weiyun\.com/,
                /^https?:\/\/share\.weiyun\.com/
            ],
            color: '#00A4FF'
        },
        QUARK: {
            name: '夸克网盘',
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
            if (key && value) cookies[key] = decodeURIComponent(value);
        });
        return cookies[name] || '';
    }

    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '未知大小';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 使用Chrome Extension API进行跨域请求
    async function crossOriginRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    action: 'crossOriginRequest',
                    data: { url, options }
                },
                (response) => {
                    if (response.success) {
                        resolve({
                            ok: response.data.ok,
                            status: response.data.status,
                            text: () => Promise.resolve(
                                typeof response.data.data === 'string'
                                    ? response.data.data
                                    : JSON.stringify(response.data.data)
                            ),
                            json: () => Promise.resolve(
                                typeof response.data.data === 'string'
                                    ? JSON.parse(response.data.data)
                                    : response.data.data
                            )
                        });
                    } else {
                        reject(new Error(response.error));
                    }
                }
            );
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

                // 使用Chrome Extension下载API
                chrome.runtime.sendMessage({
                    action: 'download',
                    data: { url: directLink, filename }
                }, (response) => {
                    if (!response.success) {
                        showToast(`下载失败: ${response.error}`, 'error');
                    }
                });

                return { success: true, filename, url: directLink };
            } catch (error) {
                console.error('Download failed:', error);
                showToast(`下载失败: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        }

        async batchDownload(fileList) {
            for (const file of fileList) {
                await this.download(file);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // ============ 各平台下载器实现 ============
    // (与userscript版本相同的下载器代码)

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
                if (selectedFiles.length > 0) return selectedFiles;
                return window.yunData?.fileList || [];
            }
            return [];
        }

        async getDirectLink(fileInfo) {
            try {
                const bdstoken = getCookie('BAIDUID');
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
                            'Cookie': document.cookie
                        }
                    }
                );

                const data = await response.json();
                if (data.errno === 0 && data.dlink) {
                    return data.dlink;
                }
            } catch (e) {
                console.warn('Official API failed:', e);
            }
            throw new Error('无法获取下载链接');
        }
    }

    class TianyiDownloader extends BaseDownloader {
        constructor(platform) {
            super(platform);
            this.apiBase = 'https://cloud.189.cn';
        }

        async parseFileInfo() {
            const shareCode = window.location.pathname.match(/\/web\/share\/(\w+)/)?.[1];
            if (shareCode) {
                const response = await crossOriginRequest(
                    `${this.apiBase}/api/open/share/getShareInfoByCode.action`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
            const response = await crossOriginRequest(
                `${this.apiBase}/api/open/share/getShareDownloadUrl.action`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `shareCode=${fileInfo.shareCode}&fileId=${fileInfo.fileId}`
                }
            );

            const data = await response.json();
            if (data.res_code === 0 && data.fileDownloadUrl) {
                return data.fileDownloadUrl;
            }
            throw new Error('无法获取下载链接');
        }
    }

    class LanzouDownloader extends BaseDownloader {
        async parseFileInfo() {
            const filename = document.querySelector('.filethetext')?.textContent?.trim() ||
                          document.querySelector('.b')?.textContent?.trim() ||
                          document.title;

            return [{ filename, url: window.location.href }];
        }

        async getDirectLink(fileInfo) {
            const ajaxData = this.parseAjaxData();
            if (!ajaxData) throw new Error('无法解析下载参数');

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
                if (url) return url.startsWith('http') ? url : `${domain}${url}`;
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
                                    if (scriptVarMatch) data[cleanKey] = scriptVarMatch[1];
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

    class AliyunDownloader extends BaseDownloader {
        constructor(platform) {
            super(platform);
            this.apiBase = 'https://api.aliyundrive.com';
        }

        async parseFileInfo() {
            if (window.__store__) {
                const state = window.__store__.getState();
                const files = state?.fileList?.items || [];
                return files.map(file => ({
                    fileId: file.file_id,
                    fileName: file.name,
                    fileSize: file.size,
                    driveId: file.drive_id
                }));
            }
            return [];
        }

        async getDirectLink(fileInfo) {
            const token = getCookie('token') || localStorage.getItem('token');
            const response = await crossOriginRequest(
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
            if (data.url) return data.url;
            throw new Error('无法获取下载链接');
        }
    }

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
            const response = await crossOriginRequest(
                'https://www.weiyun.com/webapp/share/download',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
            throw new Error('无法获取下载链接');
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
                console.log('夸克网盘 Share ID:', shareId);

                // 方法1: 从 __INITIAL_STATE__ 获取
                if (window.__INITIAL_STATE__) {
                    console.log('找到 __INITIAL_STATE__:', window.__INITIAL_STATE__);
                    const state = window.__INITIAL_STATE__;
                    const files = state?.list?.list || state?.share?.list || [];

                    if (files.length > 0) {
                        console.log(`✅ 从 __INITIAL_STATE__ 获取到 ${files.length} 个文件`);
                        return files.map(file => ({
                            fid: file.fid,
                            fileName: file.file_name || file.fileName,
                            fileSize: file.size || file.fileSize,
                            shareId: shareId
                        }));
                    }
                }

                // 方法2: 从 window.g_initialProps 获取
                if (window.g_initialProps) {
                    console.log('找到 g_initialProps:', window.g_initialProps);
                    const props = window.g_initialProps;
                    const files = props?.resData?.list || props?.data?.list || [];

                    if (files.length > 0) {
                        console.log(`✅ 从 g_initialProps 获取到 ${files.length} 个文件`);
                        return files.map(file => ({
                            fid: file.fid,
                            fileName: file.file_name || file.fileName,
                            fileSize: file.size || file.fileSize,
                            shareId: shareId
                        }));
                    }
                }

                // 方法3: 尝试从 API 获取
                if (shareId) {
                    console.log('尝试从 API 获取文件列表...');
                    return await this.getFileListFromAPI(shareId);
                }

                console.warn('所有方法都未能获取到文件列表');
            } catch (error) {
                console.error('Parse file info failed:', error);
            }
            return [];
        }

        async getFileListFromAPI(shareId) {
            try {
                const response = await crossOriginRequest(
                    `${this.apiBase}/1/clouddrive/share/sharepage/detail`,
                    {
                        method: 'POST',
                        headers: this.quarkHeaders,
                        body: JSON.stringify({
                            pwd_id: shareId,
                            pdir_fid: '0',
                            force: 0,
                            _page: 1,
                            _size: 100,
                            _sort: 'file_type:asc,updated_at:desc'
                        })
                    }
                );

                const data = await response.json();
                console.log('API 响应:', data);

                if (data.status === 200 && data.data?.list) {
                    console.log(`✅ 从 API 获取到 ${data.data.list.length} 个文件`);
                    return data.data.list.map(file => ({
                        fid: file.fid,
                        fileName: file.file_name,
                        fileSize: file.size,
                        shareId: shareId
                    }));
                }
            } catch (error) {
                console.error('Get file list from API failed:', error);
            }
            return [];
        }

        getShareId() {
            const match = window.location.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
            return match ? match[1] : null;
        }

        async getDirectLink(fileInfo) {
            try {
                const response = await crossOriginRequest(
                    `${this.apiBase}/1/clouddrive/share/sharepage/download`,
                    {
                        method: 'POST',
                        headers: this.quarkHeaders,
                        body: JSON.stringify({
                            fids: [fileInfo.fid],
                            share_id: fileInfo.shareId
                        })
                    }
                );

                const data = await response.json();
                console.log('下载链接 API 响应:', data);

                if (data.status === 200 && data.data && data.data.length > 0) {
                    const fileData = data.data[0];
                    if (fileData.download_url) {
                        return fileData.download_url;
                    }
                }
            } catch (error) {
                console.error('Get direct link failed:', error);
            }

            throw new Error('无法获取下载链接');
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
                    if (pattern.test(url)) return { key, ...platform };
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
            if (document.getElementById('netdisk-ext-styles')) return;

            const style = document.createElement('style');
            style.id = 'netdisk-ext-styles';
            style.textContent = `
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
            `;
            document.head.appendChild(style);
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

            const insertBtn = () => {
                const target = document.querySelector(targetSelector);
                if (target && !document.querySelector('.netdisk-download-btn')) {
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
                    btn.addEventListener('click', () => this.handleDownload());
                    target.insertBefore(btn, target.firstChild);
                }
            };

            setTimeout(insertBtn, 1000);
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
            console.log('网盘直链下载增强工具已启动 (Chrome Extension)');
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
