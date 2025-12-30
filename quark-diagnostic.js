// 夸克网盘诊断工具 - 在夸克网盘分享页面的控制台中运行

(function() {
    console.log('=== 夸克网盘诊断工具开始 ===');

    // 1. 检查页面全局变量
    console.log('\n1. 检查全局变量:');
    console.log('unsafeWindow.__INITIAL_STATE__:', unsafeWindow.__INITIAL_STATE__);
    console.log('unsafeWindow.g_initialProps:', unsafeWindow.g_initialProps);

    // 2. 拦截所有网络请求
    console.log('\n2. 开始拦截网络请求 (持续30秒)...');
    console.log('请点击页面上的"下载"或"保存"按钮');

    const originalFetch = window.fetch;
    const originalOpen = XMLHttpRequest.prototype.open;
    const capturedRequests = [];

    // 拦截 fetch
    window.fetch = async function(...args) {
        const url = args[0];
        const options = args[1] || {};

        console.log('[FETCH]', options.method || 'GET', url);

        if (url && (url.includes('download') || url.includes('share'))) {
            capturedRequests.push({
                type: 'fetch',
                url: url,
                method: options.method || 'GET',
                headers: options.headers,
                body: options.body
            });
        }

        const response = await originalFetch.apply(this, args);

        if (url && (url.includes('download') || url.includes('share'))) {
            try {
                const clone = response.clone();
                const text = await clone.text();
                console.log('[FETCH响应]', url);
                console.log('响应内容:', text.substring(0, 500));

                try {
                    const json = JSON.parse(text);
                    console.log('JSON响应:', json);
                } catch (e) {}
            } catch (e) {}
        }

        return response;
    };

    // 拦截 XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        this._method = method;

        if (url && (url.includes('download') || url.includes('share'))) {
            console.log('[XHR]', method, url);
            capturedRequests.push({
                type: 'xhr',
                url: url,
                method: method
            });
        }

        return originalOpen.apply(this, arguments);
    };

    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        const url = this._url;

        if (url && (url.includes('download') || url.includes('share'))) {
            this.addEventListener('load', function() {
                console.log('[XHR响应]', url);
                console.log('响应内容:', this.responseText.substring(0, 500));

                try {
                    const json = JSON.parse(this.responseText);
                    console.log('JSON响应:', json);
                } catch (e) {}
            });
        }

        return originalSend.apply(this, arguments);
    };

    // 30秒后恢复
    setTimeout(() => {
        window.fetch = originalFetch;
        XMLHttpRequest.prototype.open = originalOpen;
        XMLHttpRequest.prototype.send = originalSend;

        console.log('\n=== 诊断完成 ===');
        console.log('捕获的请求:', capturedRequests);
        console.log('\n请将以上所有日志复制给开发者');
    }, 30000);

    console.log('\n拦截器已激活，请在30秒内点击下载按钮...');
})();
