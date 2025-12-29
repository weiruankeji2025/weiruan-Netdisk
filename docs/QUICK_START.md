# 快速开始 ⚡

## 30秒快速上手

### 油猴脚本版 (最简单)

1. **安装Tampermonkey**
   - Chrome/Edge: [点击安装](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

2. **安装脚本**
   - 打开文件: `src/userscript/netdisk-downloader.user.js`
   - Tampermonkey会自动识别并安装

3. **开始使用**
   - 打开百度网盘或其他支持的网盘
   - 点击"直链下载"按钮
   - 完成! 🎉

### Chrome插件版

1. **下载项目**
   ```bash
   git clone https://github.com/weiruankeji/weiruan-Netdisk.git
   ```

2. **加载插件**
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `src/extension/` 文件夹

3. **开始使用**
   - 打开网盘网站
   - 点击"直链下载"按钮
   - 完成! 🎉

## 支持哪些网盘?

- ✅ 百度网盘 (pan.baidu.com)
- ✅ 天翼云盘 (cloud.189.cn)
- ✅ 蓝奏云 (lanzou*.com)
- ✅ 阿里云盘 (aliyundrive.com)
- ✅ 微云 (weiyun.com)

## 如何使用?

### 百度网盘示例

1. 打开百度网盘分享链接
2. 看到页面上的"直链下载"按钮
3. 点击按钮
4. 选择要下载的文件
5. 浏览器自动开始下载

### 天翼云盘示例

1. 打开天翼云盘分享链接
2. 输入访问密码(如果有)
3. 点击"直链下载"
4. 选择文件并下载

### 蓝奏云示例

1. 打开蓝奏云下载页面
2. 点击"直链下载"
3. 自动获取并下载

## 常见问题

### Q: 找不到"直链下载"按钮?
A: 请确认:
- 脚本/插件已正确安装
- 当前网站是支持的平台
- 刷新页面重试

### Q: 无法获取下载链接?
A: 请检查:
- 是否已登录网盘账号
- 文件是否可以正常下载
- 查看浏览器控制台错误信息

### Q: 下载速度慢?
A: 建议:
- 使用下载管理器(如IDM)
- 开通网盘会员
- 更换网络环境

## 进阶使用

### 配合下载管理器

1. 点击"直链下载"获取链接
2. 复制直链地址
3. 在IDM或其他下载器中新建任务
4. 粘贴链接并下载

### 批量下载

1. 选择多个文件
2. 点击"直链下载"
3. 在弹窗中选择要下载的文件
4. 点击"批量下载全部"或单独下载

## 更多帮助

- 📖 [油猴脚本详细教程](USERSCRIPT_INSTALL.md)
- 📖 [Chrome插件详细教程](EXTENSION_INSTALL.md)
- 🐛 [问题反馈](https://github.com/weiruankeji/weiruan-Netdisk/issues)

---

**提示:** 如果遇到问题,请先查看详细教程,如仍无法解决,欢迎提交Issue。
