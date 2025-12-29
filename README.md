# 网盘直链下载增强工具 🚀

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/browsers-18+-orange.svg" alt="Browsers">
  <img src="https://img.shields.io/badge/platforms-6+-brightgreen.svg" alt="Platforms">
</p>

一个强大的网盘直链下载工具,支持百度网盘、天翼云盘、蓝奏云、阿里云盘、微云、夸克网盘等主流网盘平台。**适配18+主流浏览器**,提供**油猴脚本**和**Chrome插件**两个版本,操作简单,一键获取直链,直接调用浏览器下载器。

## ✨ 特性

- 🎯 **全平台支持** - 覆盖主流受限网盘平台
- ⚡ **一键获取** - 简单快捷,无需复杂操作
- 🔗 **直链下载** - 绕过限速,直接调用浏览器下载
- 💾 **双版本** - 同时提供油猴脚本和Chrome插件
- 🎨 **精美界面** - 现代化UI设计,操作体验流畅
- 🔒 **安全隐私** - 本地运行,不上传任何数据
- 📊 **下载统计** - 记录下载历史和统计信息
- 🆓 **完全免费** - 开源项目,永久免费使用

## 🌐 支持平台

| 平台 | 状态 | 个人网盘 | 分享链接 |
|------|------|---------|---------|
| 🔵 百度网盘 | ✅ 支持 | ✅ | ✅ |
| 🔷 天翼云盘 | ✅ 支持 | ✅ | ✅ |
| 🔹 蓝奏云 | ✅ 支持 | - | ✅ |
| 🟠 阿里云盘 | ✅ 支持 | ✅ | ✅ |
| 🔵 微云 | ✅ 支持 | ✅ | ✅ |
| 💜 夸克网盘 | ✅ 支持 | ✅ | ✅ |
| ⚡ 迅雷云盘 | 🔄 开发中 | - | - |

## 🌍 浏览器兼容性

本工具广泛适配18+主流浏览器,确保在各种环境下都能正常使用:

### 基于Chromium内核
- ✅ **Chrome** - Google Chrome浏览器
- ✅ **Microsoft Edge** - 微软Edge浏览器
- ✅ **360浏览器** - 360安全浏览器/极速浏览器
- ✅ **QQ浏览器** - 腾讯QQ浏览器
- ✅ **搜狗浏览器** - 搜狗高速浏览器
- ✅ **百分浏览器** - 百分浏览器
- ✅ **遨游浏览器** - Maxthon遨游浏览器
- ✅ **星愿浏览器** - Twinkstar星愿浏览器
- ✅ **猎豹浏览器** - 猎豹安全浏览器
- ✅ **Opera** - Opera浏览器
- ✅ **Vivaldi** - Vivaldi浏览器
- ✅ **Brave** - Brave浏览器
- ✅ **Yandex** - Yandex浏览器
- ✅ **Kiwi Browser** - Kiwi浏览器(移动端)

### 其他内核
- ✅ **Firefox** - Mozilla Firefox浏览器
- ✅ **Safari** - Apple Safari浏览器(需Tampermonkey)
- ✅ **Edge Legacy** - 旧版Edge浏览器
- ✅ **其他** - 支持Tampermonkey的浏览器

> **提示**: 油猴脚本版兼容性最好,支持以上所有浏览器。Chrome插件版适用于所有基于Chromium的浏览器。

## 📦 安装方式

### 方式一:油猴脚本版 (推荐)

**优点:**
- 跨浏览器兼容(Chrome、Firefox、Edge、Safari等)
- 安装简单,一键安装
- 自动更新

**安装步骤:**

1. **安装Tampermonkey扩展**
   - [Chrome/Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)
   - [Safari](https://apps.apple.com/cn/app/tampermonkey/id1482490089)

2. **安装脚本**
   - 点击安装: [netdisk-downloader.user.js](src/userscript/netdisk-downloader.user.js)
   - 或访问 [Greasy Fork](https://greasyfork.org) (待发布)

3. **使用**
   - 打开网盘网站,即可看到"直链下载"按钮

📖 **详细教程:** [油猴脚本安装指南](docs/USERSCRIPT_INSTALL.md)

### 方式二:Chrome插件版

**优点:**
- 无需安装Tampermonkey
- 更好的性能
- 原生浏览器集成

**安装步骤:**

1. **下载源码**
   ```bash
   git clone https://github.com/weiruankeji/weiruan-Netdisk.git
   cd weiruan-Netdisk
   ```

2. **加载插件**
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `src/extension/` 文件夹

3. **使用**
   - 打开网盘网站,即可看到"直链下载"按钮

📖 **详细教程:** [Chrome插件安装指南](docs/EXTENSION_INSTALL.md)

## 🎯 使用方法

### 基本操作

1. **打开支持的网盘网站**
2. **选择要下载的文件** (某些平台需要勾选)
3. **点击"直链下载"按钮**
4. **等待获取直链**
5. **浏览器自动开始下载**

### 批量下载

1. 选择多个文件
2. 点击"直链下载"
3. 在弹窗中选择要下载的文件
4. 点击单个下载或批量下载

### 使用下载管理器

获取直链后,可以配合以下下载管理器使用:
- IDM (Internet Download Manager)
- Free Download Manager
- Aria2
- 其他支持直链的下载器

## 🖼️ 界面预览

### 下载按钮
页面上会自动添加"直链下载"按钮,点击即可获取直链。

### 文件列表
多文件时会显示文件列表,可以选择单个或批量下载。

### Chrome插件面板
显示支持平台、下载统计、设置选项等。

## 🔧 技术架构

### 项目结构

```
weiruan-Netdisk/
├── src/
│   ├── core/                    # 核心功能模块
│   │   ├── constants.js         # 常量定义
│   │   ├── utils.js            # 工具函数
│   │   ├── downloader.js       # 下载器基类
│   │   ├── factory.js          # 下载器工厂
│   │   ├── ui.js               # UI组件
│   │   └── platforms/          # 平台适配器
│   │       ├── baidu.js        # 百度网盘
│   │       ├── tianyi.js       # 天翼云盘
│   │       ├── lanzou.js       # 蓝奏云
│   │       ├── aliyun.js       # 阿里云盘
│   │       ├── weiyun.js       # 微云
│   │       └── quark.js        # 夸克网盘
│   ├── userscript/             # 油猴脚本版本
│   │   └── netdisk-downloader.user.js
│   └── extension/              # Chrome插件版本
│       ├── manifest.json
│       ├── background.js
│       ├── content.js
│       └── popup/
│           ├── popup.html
│           └── popup.js
├── docs/                       # 文档
│   ├── USERSCRIPT_INSTALL.md  # 油猴脚本安装指南
│   └── EXTENSION_INSTALL.md   # Chrome插件安装指南
├── assets/                     # 资源文件
├── LICENSE                     # 许可证
└── README.md                   # 项目说明
```

### 核心技术

- **原生JavaScript** - 无依赖,轻量高效
- **模块化设计** - 易于扩展和维护
- **工厂模式** - 统一管理各平台下载器
- **Chrome Extension API** - 插件版本使用
- **GM API** - 油猴脚本版本使用

### 工作原理

1. **平台检测** - 自动识别当前网盘平台
2. **文件解析** - 从页面或API获取文件信息
3. **直链获取** - 通过各平台API获取直接下载链接
4. **下载触发** - 调用浏览器原生下载功能

## 📝 开发计划

### v1.1.0 (当前版本) ✅
- [x] 百度网盘支持
- [x] 天翼云盘支持
- [x] 蓝奏云支持
- [x] 阿里云盘支持
- [x] 微云支持
- [x] 夸克网盘支持
- [x] 油猴脚本版本
- [x] Chrome插件版本
- [x] 基础UI界面
- [x] 18+浏览器适配

### v1.2.0 (计划中) 🔄
- [ ] 迅雷云盘支持
- [ ] OneDrive支持
- [ ] 115网盘支持
- [ ] 下载历史管理
- [ ] 自定义下载路径
- [ ] 暗黑模式

### v2.0.0 (未来规划) 💡
- [ ] 多线程下载
- [ ] 断点续传
- [ ] 文件预览
- [ ] 分享链接解析
- [ ] 云端同步设置

## ⚠️ 免责声明

1. 本工具仅供学习交流使用
2. 请遵守网盘服务条款,不要滥用
3. 下载的内容请确保符合法律法规
4. 尊重知识产权,不下载侵权内容
5. 使用本工具产生的任何后果由用户自行承担

## 🤝 贡献指南

欢迎贡献代码!请遵循以下步骤:

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献方向

- 🐛 修复Bug
- ✨ 添加新功能
- 📝 改进文档
- 🎨 优化UI/UX
- 🌐 添加新平台支持
- 🔧 性能优化

## 📞 问题反馈

遇到问题或有建议?

- 🐛 [提交Bug](https://github.com/weiruankeji/weiruan-Netdisk/issues/new?labels=bug)
- 💡 [功能建议](https://github.com/weiruankeji/weiruan-Netdisk/issues/new?labels=enhancement)
- 💬 [讨论交流](https://github.com/weiruankeji/weiruan-Netdisk/discussions)

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

```
MIT License

Copyright (c) 2024 WeiRuan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🌟 Star History

如果这个项目对你有帮助,请给个Star⭐️支持一下!

## 👥 贡献者

感谢所有为这个项目做出贡献的开发者!

## 🔗 相关链接

- [GitHub Repository](https://github.com/weiruankeji/weiruan-Netdisk)
- [Issues](https://github.com/weiruankeji/weiruan-Netdisk/issues)
- [Pull Requests](https://github.com/weiruankeji/weiruan-Netdisk/pulls)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/weiruankeji">WeiRuan</a>
</p>

<p align="center">
  <sub>如果觉得有用,请给个⭐️Star支持一下!</sub>
</p>
