# 快速部署指南

## 选择部署方案

- **有云服务器？** → 查看 [云服务器部署指南](./DEPLOYMENT_SERVER.md)
- **没有服务器？** → 使用 Vercel（下方方案）

---

## 🚀 方案：Vercel + Vercel Postgres（无服务器）

### 5 分钟快速部署

#### 步骤 1：准备代码

```bash
# 确保代码已提交
git add .
git commit -m "准备部署"
git push origin main
```

#### 步骤 2：部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "Add New Project"
4. 导入你的仓库
5. 点击 "Deploy"（使用默认配置）

#### 步骤 3：添加数据库

1. 在 Vercel 项目页面，点击 "Storage"
2. 点击 "Create Database" → 选择 "Postgres"
3. 选择 "Hobby" 免费计划
4. 创建数据库

#### 步骤 4：配置环境变量

在 Vercel 项目设置 → Environment Variables 添加：

```env
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=运行 openssl rand -base64 32 生成
```

**注意：** `DATABASE_URL` 会自动添加，无需手动配置。

#### 步骤 5：初始化数据库

在 Vercel 项目页面：

1. 点击 "Deployments"
2. 点击最新的部署
3. 点击 "..." → "Redeploy"（触发重新部署）

或者使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并链接项目
vercel login
vercel link

# 拉取环境变量
vercel env pull .env.local

# 初始化数据库
pnpm db:push
```

#### 步骤 6：更新 OAuth 回调 URL

**GitHub OAuth：**
- 回调 URL: `https://your-project.vercel.app/api/auth/callback/github`

**Google OAuth：**
- 回调 URL: `https://your-project.vercel.app/api/auth/callback/google`

---

## 📋 部署检查清单

### 部署前
- [ ] 代码已提交到 Git
- [ ] 运行 `pnpm build` 成功
- [ ] 运行 `pnpm lint` 无错误
- [ ] `.env.local` 已添加到 `.gitignore`

### 部署后
- [ ] 数据库已初始化（运行 `pnpm db:push`）
- [ ] 环境变量已配置
- [ ] OAuth 回调 URL 已更新
- [ ] 测试登录功能
- [ ] 测试创建笔记
- [ ] 测试发布文章

---

## 🔧 环境变量列表

### 必需
- `DATABASE_URL` - 数据库连接（Vercel Postgres 自动配置）
- `NEXTAUTH_URL` - 生产环境 URL
- `NEXTAUTH_SECRET` - 随机密钥

### 可选（OAuth 登录）
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🐛 常见问题

**Q: 部署后无法连接数据库？**
- 检查 `DATABASE_URL` 是否正确
- 确保数据库已创建

**Q: NextAuth 登录失败？**
- 检查 `NEXTAUTH_URL` 是否为生产环境 URL
- 更新 OAuth 回调 URL

**Q: 构建失败？**
- 检查所有依赖是否安装
- 查看构建日志中的错误信息

---

## 📚 详细文档

查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 获取完整部署指南。

