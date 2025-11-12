# AIPrompt2Draw - 一语成图

<div align="center">

![AIPrompt2Draw Logo](assets/images/Prompt2Draw-w.png)

**🚀 零安装、秒开的AI流程图生成器**

通过自然语言描述，快速生成专业的DrawIO流程图、架构图、UML图等

[![GitHub stars](https://img.shields.io/github/stars/silenceallat/AIPrompt2Draw?style=social)](https://github.com/silenceallat/AIPrompt2Draw)
[![GitHub forks](https://img.shields.io/github/forks/silenceallat/AIPrompt2Draw?style=social)](https://github.com/silenceallat/AIPrompt2Draw)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/silenceallat/AIPrompt2Draw/releases)

</div>

## ✨ 特性

- 🎯 **零安装秒开** - 纯前端应用，无需任何依赖或安装步骤
- 🔧 **多AI服务商支持** - 支持硅基流动、OpenRouter、Kimi、智谱GLM等
- 🎨 **集成DrawIO编辑器** - 内置diagrams.net，支持直接编辑和导出
- 💾 **本地配置存储** - API密钥安全存储在本地，不上传云端
- 🌙 **深色模式** - 支持明暗主题切换，保护眼睛
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔄 **流式输出** - 实时查看AI生成过程
- 💡 **智能提示** - 内置常用流程图模板和示例

## 🚀 快速开始

### 方法一：直接使用（推荐）

1. 访问 [在线演示地址](https://silenceallat.github.io/AIPrompt2Draw/)
2. 点击右上角 ⚙️ 配置你的API密钥
3. 开始描述你想要的流程图！

### 方法二：本地部署

```bash
# 克隆项目
git clone https://github.com/silenceallat/AIPrompt2Draw.git
cd AIPrompt2Draw

# 直接打开HTML文件
# 双击 src/index.html 或用浏览器打开
```

### 方法三：部署到自己的服务器

```bash
# 上传到任意静态文件服务器
# 推荐：GitHub Pages、Netlify、Vercel、Gitee Pages等
```

## 📋 使用教程

### 1. 配置API密钥

支持以下AI服务商：

| 服务商 | 特点 | 推荐模型 |
|--------|------|----------|
| 硅基流动 | 国产稳定，价格优惠 | `zai-org/GLM-4.6` |
| OpenRouter | 模型丰富，支持多种API | `anthropic/claude-sonnet-4.5` |
| Kimi | 擅长长文本理解 | `kimi-k2-thinking` |
| 智谱GLM | 国产大模型，中文友好 | `glm-4.6` |
| MiniMax | 创意生成能力强 | `MiniMax-M2` |

### 2. 描述流程图

使用自然语言描述你想要的流程图：

```
创建一个电商订单处理流程图，包括下单、支付、发货、收货等环节
```

```
画一个用户登录验证的UML时序图
```

```
生成一个微服务架构图，包括API网关、用户服务、订单服务、支付服务
```

### 3. 编辑和导出

- 🚀 **自动加载** - AI生成后自动加载到左侧编辑器
- 📋 **复制XML** - 支持手动复制XML代码到其他DrawIO实例
- 💾 **导出格式** - 支持PNG、SVG、PDF、XML等多种格式

## 🎯 使用示例

### 流程图示例

**输入：**
```
创建一个请假审批流程：员工提交申请 → 部门经理审批 → 人事备案 → 审批结果通知
```

**输出：**
自动生成包含菱形判断框、矩形处理框的完整流程图

### 架构图示例

**输入：**
```
设计一个微服务架构：前端应用 → API网关 → 用户服务/订单服务/商品服务 → MySQL数据库/Redis缓存
```

**输出：**
专业的微服务架构图，包含不同形状的服务组件和数据存储

## 🛠️ 技术架构

```
AIPrompt2Draw/
├── src/
│   ├── css/
│   │   └── style.css          # 完整样式文件
│   ├── js/
│   │   ├── config.js          # 配置管理模块
│   │   ├── core.js            # 核心API调用模块
│   │   ├── drawio-generator.js # DrawIO集成模块
│   │   ├── ui.js              # 用户界面管理模块
│   │   └── utils.js           # 工具函数模块
│   └── index.html             # 主入口文件
├── docs/                      # 文档目录
├── assets/                    # 资源文件
└── README.md                  # 项目说明
```

### 核心模块

- **ConfigManager** - API配置管理，支持多服务商切换
- **CoreEngine** - AI API调用，支持流式和非流式输出
- **DrawIOGenerator** - DrawIO编辑器集成，XML处理和加载
- **UIManager** - 用户界面管理，主题切换，消息显示
- **Utils** - 通用工具函数，存储管理，文件操作

## 🔧 开发指南

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/silenceallat/AIPrompt2Draw.git
cd AIPrompt2Draw

# 2. 启动本地服务器（可选）
# 使用Python
python -m http.server 8000

# 使用Node.js
npx serve .

# 使用PHP
php -S localhost:8000

# 3. 访问 http://localhost:8000/src/
```

### 项目结构说明

- **零依赖设计** - 纯原生JavaScript，无需构建工具
- **模块化架构** - 清晰的模块划分，易于维护和扩展
- **本地优先** - 配置和数据完全存储在用户本地
- **渐进增强** - 基础功能不依赖外部服务，高级功能可选择性启用

### 添加新的AI服务商

在 `src/js/config.js` 中添加新的服务商配置：

```javascript
const providerPresets = {
    // ... 现有服务商
    'new-provider': {
        apiUrl: 'https://api.newprovider.com/v1/chat/completions',
        authScheme: 'Bearer', // 或 'Direct'
        models: ['model-1', 'model-2']
    }
};
```

## 🔒 隐私和安全

- ✅ **本地存储** - 所有配置和对话记录完全存储在用户本地
- ✅ **无服务器依赖** - 不收集或上传任何用户数据
- ✅ **开源透明** - 代码完全开源，安全可审计
- ✅ **API密钥安全** - 密钥仅用于API调用，不进行任何记录

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. **Fork项目** 并创建你的功能分支
2. **提交你的修改** 并确保代码质量
3. **创建Pull Request** 并详细描述你的修改

### 贡献方向

- 🐛 Bug修复
- ✨ 新功能开发
- 📝 文档改进
- 🎨 UI/UX优化
- 🌐 国际化支持

### 开发规范

- 使用原生JavaScript，避免引入外部依赖
- 保持代码简洁和可读性
- 添加适当的注释
- 确保响应式设计兼容性

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [diagrams.net](https://www.diagrams.net/) - 优秀的开源图表编辑器
- [DrawIO](https://github.com/jgraph/drawio) - 强大的图表生成库
- 各大AI服务商提供的优秀API服务

## 📞 联系我们

- 🐛 **Bug反馈**: [GitHub Issues](https://github.com/silenceallat/AIPrompt2Draw/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/silenceallat/AIPrompt2Draw/discussions)
- 📧 **邮件联系**: silenceallat@gmail.com

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by silenceallat
