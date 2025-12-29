# 油猴脚本版 - 安装教程

## 什么是油猴脚本?

油猴脚本(Tampermonkey)是一个用户脚本管理器,可以让你在浏览器中运行自定义脚本,增强网页功能。

## 安装步骤

### 第一步:安装Tampermonkey扩展

根据你使用的浏览器,选择对应的安装方式:

#### Chrome / Edge / Opera
1. 访问 [Chrome网上应用店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. 点击"添加至Chrome"或"添加至Edge"
3. 确认安装

#### Firefox
1. 访问 [Firefox附加组件商店](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)
2. 点击"添加到Firefox"
3. 确认安装

#### Safari
1. 访问 [App Store](https://apps.apple.com/cn/app/tampermonkey/id1482490089)
2. 下载并安装Tampermonkey

### 第二步:安装脚本

1. **点击安装脚本文件**
   - 直接打开文件: `src/userscript/netdisk-downloader.user.js`
   - 或访问在线地址(如果有发布到Greasy Fork等)

2. **Tampermonkey会自动识别**
   - 浏览器会打开Tampermonkey安装页面
   - 显示脚本的详细信息

3. **点击"安装"按钮**
   - 确认脚本权限
   - 等待安装完成

### 第三步:验证安装

1. 打开任意支持的网盘网站(如百度网盘)
2. 在页面上寻找"直链下载"按钮
3. 如果看到按钮,说明安装成功!

## 使用方法

### 百度网盘

1. 打开百度网盘分享链接或个人网盘
2. 选择要下载的文件(个人网盘需要勾选文件)
3. 点击页面上的"直链下载"按钮
4. 等待获取直链
5. 浏览器会自动开始下载

### 天翼云盘

1. 打开天翼云盘分享链接
2. 点击"直链下载"按钮
3. 选择要下载的文件
4. 浏览器自动下载

### 蓝奏云

1. 打开蓝奏云下载页面
2. 点击"直链下载"按钮
3. 自动获取直链并下载

### 阿里云盘

1. 打开阿里云盘页面
2. 选择要下载的文件
3. 点击"直链下载"按钮
4. 浏览器自动下载

### 微云

1. 打开微云分享链接
2. 点击"直链下载"按钮
3. 选择要下载的文件
4. 浏览器自动下载

## 常见问题

### 1. 脚本没有运行?

**解决方法:**
- 确认Tampermonkey已启用(浏览器右上角图标不是灰色)
- 检查脚本是否已启用(打开Tampermonkey面板查看)
- 刷新网页重试

### 2. 找不到"直链下载"按钮?

**解决方法:**
- 确认当前网站是支持的平台
- 等待页面完全加载
- 刷新页面重试
- 检查浏览器控制台是否有错误信息(F12打开)

### 3. 无法获取下载链接?

**解决方法:**
- 确认已登录网盘账号
- 检查文件是否可以正常下载
- 某些大文件或加密文件可能无法获取直链
- 网盘API可能已更新,等待脚本更新

### 4. 下载速度慢?

**解决方法:**
- 直链下载速度取决于网盘服务器
- 建议使用下载管理器(如IDM、Free Download Manager)
- 复制直链地址到下载器中使用

## 更新脚本

### 自动更新
Tampermonkey会定期检查脚本更新,有新版本时会自动更新。

### 手动更新
1. 打开Tampermonkey面板
2. 找到"网盘直链下载增强工具"
3. 点击脚本名称进入编辑页
4. 点击工具栏的"更新"按钮

## 卸载脚本

1. 点击浏览器右上角的Tampermonkey图标
2. 选择"管理面板"
3. 找到"网盘直链下载增强工具"
4. 点击删除图标
5. 确认删除

## 安全提示

- 本脚本开源免费,请勿相信任何收费版本
- 不要随意安装来源不明的脚本
- 定期检查脚本更新,确保使用最新版本
- 如有疑问,请访问GitHub项目页面

## 支持与反馈

- GitHub Issues: https://github.com/weiruankeji/weiruan-Netdisk/issues
- 项目主页: https://github.com/weiruankeji/weiruan-Netdisk

## 许可证

MIT License - 免费开源,可自由使用和修改
