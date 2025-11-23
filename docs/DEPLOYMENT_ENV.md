# 环境变量配置指南

## 📋 概述

本文档说明项目中所有环境变量的用途、获取方式和配置方法。

## 🔐 环境变量分类

### 必需变量（Production）

这些变量在生产环境中是必需的：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | Vercel Postgres 自动生成 |
| `NEXTAUTH_URL` | 应用的基础 URL | 生产环境域名 |
| `NEXTAUTH_SECRET` | NextAuth.js 加密密钥 | 使用 `openssl rand -base64 32` 生成 |

### 可选变量（OAuth）

如果使用 GitHub 或 Google 登录，需要配置：

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | 同上 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 同上 |

### 环境标识

| 变量名 | 说明 | 可选值 |
|--------|------|--------|
| `NODE_ENV` | 环境标识 | `development`, `preview`, `production` |

---

## 🚀 快速配置

### 1. 本地开发环境

```bash
# 1. 复制模板文件
cp .env.example .env.local

# 2. 编辑 .env.local，填写实际值
# DATABASE_URL=postgresql://...
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=...

# 3. 验证配置
pnpm validate-env
```

### 2. Vercel 生产环境

1. 在 Vercel 项目设置 → Environment Variables 中添加变量
2. 为不同环境（Production、Preview、Development）分别配置
3. 使用 Vercel CLI 验证：`vercel env pull .env.local`

---

## 🔍 环境变量验证

### 使用验证脚本

```bash
# 验证当前环境
pnpm validate-env

# 验证生产环境配置
pnpm validate-env --env=production
```

### 验证内容

- ✅ 检查必需变量是否存在
- ✅ 验证变量格式是否正确
- ✅ 检查 OAuth 配置的完整性
- ✅ 验证 URL 格式

---

## 📝 详细说明

### DATABASE_URL

**格式**：
```
postgresql://user:password@host:port/database?schema=public
```

**示例**：
- 本地：`postgresql://postgres:password@localhost:5432/knowledge_blog?schema=public`
- Vercel：`postgres://user:password@host:5432/db?sslmode=require`

**注意**：
- Vercel Postgres 会自动添加 `sslmode=require`
- 生产环境建议使用连接池：`?connection_limit=10&pool_timeout=20`

---

### NEXTAUTH_URL

**格式**：完整的 URL（包含协议）

**示例**：
- 本地：`http://localhost:3000`
- 生产：`https://your-domain.com`

**注意**：
- 必须与实际访问的域名一致
- 不要以斜杠结尾

---

### NEXTAUTH_SECRET

**生成方式**：
```bash
# 方式 1：使用 OpenSSL
openssl rand -base64 32

# 方式 2：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**要求**：
- 长度至少 32 个字符
- 随机生成，不要使用固定值
- 不同环境使用不同的密钥

---

### OAuth 配置

#### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: 你的应用名称
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. 获取 Client ID 和 Client Secret

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭据
5. 设置授权重定向 URI: `https://your-domain.com/api/auth/callback/google`
6. 获取 Client ID 和 Client Secret

---

## 🔒 安全建议

### 1. 不要提交敏感信息

- ✅ 将 `.env.local` 添加到 `.gitignore`
- ✅ 使用 `.env.example` 作为模板
- ✅ 不要在代码中硬编码密钥

### 2. 使用环境变量管理工具

- **Vercel**：使用加密环境变量
- **GitHub Secrets**：用于 CI/CD
- **本地开发**：使用 `.env.local`

### 3. 定期轮换密钥

- 定期更新 `NEXTAUTH_SECRET`
- OAuth Secret 泄露时立即更新
- 使用不同的密钥用于不同环境

---

## 🐛 常见问题

### Q: 环境变量验证失败？

**A:** 检查：
1. `.env.local` 文件是否存在
2. 变量名是否正确（区分大小写）
3. 必需变量是否都已设置
4. 变量值格式是否正确

### Q: OAuth 登录失败？

**A:** 检查：
1. Client ID 和 Secret 是否正确
2. 回调 URL 是否匹配
3. OAuth App 是否已启用

### Q: 数据库连接失败？

**A:** 检查：
1. `DATABASE_URL` 格式是否正确
2. 数据库是否允许外部连接
3. 防火墙设置

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [快速部署](./DEPLOYMENT_QUICK_START.md)
- [OAuth 设置指南](./OAUTH_SETUP_GUIDE.md)

