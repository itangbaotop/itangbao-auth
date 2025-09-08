# AuthHub - 开源身份认证服务

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GitHub stars](https://img.shields.io/github/stars/your-username/authhub.svg)](https://github.com/your-username/authhub/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-username/authhub.svg)](https://github.com/your-username/authhub/network)

现代化、安全、易用的开源身份认证解决方案，支持多种登录方式，几分钟内完成集成。

## ✨ 特性

- 🔐 **企业级安全** - 采用最新的安全标准，保护您的数据安全
- ⚡ **快速部署** - 几分钟内即可部署完成，开箱即用
- 🌐 **多种登录方式** - 支持 Google、GitHub、邮箱等多种登录方式
- 🌍 **国际化支持** - 支持多语言，覆盖全球用户
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **高度可定制** - 灵活的配置选项，满足不同需求

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/authhub.git
cd authhub
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 .env.local 文件，配置必要的环境变量：

```env
# 数据库配置
DATABASE_URL="your-database-url"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (可选)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (可选)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

3. 启动开发服务器
4. 
```bash
npm run dev
```     
访问 http://localhost:3000 查看结果。


📞 联系我们
GitHub Issues: https://github.com/your-username/authhub/issues
GitHub Discussions: https://github.com/your-username/authhub/discussions
⭐ 如果这个项目对您有帮助，请给我们一个 Star！

todo
- [ ] 增加google一键登录
- [ ] 增加深色模式

