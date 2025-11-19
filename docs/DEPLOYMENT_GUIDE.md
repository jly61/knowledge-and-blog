# 部署指南

## 推荐部署方案

### 方案 1：Vercel + Vercel Postgres（推荐，最简单）

**优点：**
- ✅ 零配置，自动部署
- ✅ 免费额度充足
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 与 Next.js 完美集成

**步骤：**

#### 1. 准备代码

```bash
# 确保代码已提交到 Git
git add .
git commit -m "准备部署"
git push
```

#### 2. 在 Vercel 部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库
5. 配置项目：
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `pnpm build`（或 `npm run build`）
   - **Output Directory**: `.next`（默认）
   - **Install Command**: `pnpm install`（或 `npm install`）

#### 3. 配置数据库（Vercel Postgres）

1. 在 Vercel 项目页面，点击 "Storage" 标签
2. 点击 "Create Database" → 选择 "Postgres"
3. 选择免费计划（Hobby）
4. 创建数据库
5. Vercel 会自动添加 `DATABASE_URL` 环境变量

#### 4. 配置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```env
# NextAuth.js（必需）
NEXTAUTH_URL=https://knowledge-and-blog.vercel.app
NEXTAUTH_SECRET=生成一个随机字符串（见下方）

# OAuth（可选，如果使用 GitHub/Google 登录）
GITHUB_CLIENT_ID=你的GitHub_Client_ID
GITHUB_CLIENT_SECRET=你的GitHub_Client_Secret
GOOGLE_CLIENT_ID=你的Google_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
```

**生成 NEXTAUTH_SECRET：**
```bash
openssl rand -base64 32
```

#### 5. 初始化数据库

部署后，在 Vercel 的部署日志中运行数据库迁移：

1. 在 Vercel 项目页面，点击 "Deployments"
2. 点击最新的部署
3. 在 "Build Logs" 中查看是否有错误

或者使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 运行数据库迁移
vercel env pull .env.local
pnpm db:push
```

#### 6. 更新 OAuth 回调 URL

**GitHub OAuth：**
- 回调 URL 更新为：`https://your-domain.vercel.app/api/auth/callback/github`

**Google OAuth：**
- Authorized redirect URIs 更新为：`https://your-domain.vercel.app/api/auth/callback/google`

---

### 方案 2：Vercel + Supabase（推荐，免费额度更大）

**优点：**
- ✅ Supabase 免费额度更大（500MB 数据库）
- ✅ 包含数据库管理界面
- ✅ 支持实时功能

**步骤：**

#### 1-2. 同方案 1（准备代码和部署到 Vercel）

#### 3. 创建 Supabase 数据库

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 等待项目创建完成（约 2 分钟）
4. 在项目设置 → Database → Connection string 获取连接字符串

#### 4. 配置环境变量

在 Vercel 中添加：

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres?schema=public
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=你的密钥
# ... 其他环境变量
```

#### 5. 初始化数据库

使用 Supabase SQL Editor 或本地运行：

```bash
# 拉取环境变量
vercel env pull .env.local

# 推送数据库 Schema
pnpm db:push
```

---

### 方案 3：Railway（全栈平台）

**优点：**
- ✅ 包含数据库和应用部署
- ✅ 简单易用
- ✅ 免费额度

**步骤：**

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 创建新项目 → "Deploy from GitHub repo"
4. 添加 PostgreSQL 数据库
5. 配置环境变量
6. 自动部署

---

## 部署前检查清单

### ✅ 代码检查

- [ ] 确保 `.env.local` 已添加到 `.gitignore`
- [ ] 检查所有环境变量都有默认值或错误处理
- [ ] 运行 `pnpm build` 确保构建成功
- [ ] 运行 `pnpm lint` 检查代码规范

### ✅ 数据库检查

- [ ] 运行 `pnpm db:push` 确保 Schema 正确
- [ ] 检查所有必需的表和字段都存在
- [ ] 备份本地数据库（如果需要）

### ✅ 环境变量检查

必需的环境变量：
- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`（生产环境 URL）
- [ ] `NEXTAUTH_SECRET`

可选的环境变量：
- [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

---

## 部署后步骤

### 1. 初始化数据库

```bash
# 方法 1：使用 Vercel CLI
vercel env pull .env.local
pnpm db:push

# 方法 2：在 Vercel 部署时自动运行（需要配置）
# 在 package.json 中添加 postinstall 脚本
```

### 2. 验证部署

- [ ] 访问生产环境 URL
- [ ] 测试登录功能
- [ ] 测试创建笔记
- [ ] 测试发布文章
- [ ] 检查控制台是否有错误

### 3. 配置自定义域名（可选）

1. 在 Vercel 项目设置 → Domains
2. 添加你的域名
3. 按照提示配置 DNS
4. 更新 `NEXTAUTH_URL` 环境变量

---

## 常见问题

### Q: 部署后数据库连接失败？

**A:** 检查：
1. `DATABASE_URL` 环境变量是否正确
2. 数据库是否允许外部连接（Vercel Postgres 默认允许）
3. 防火墙设置

### Q: NextAuth 登录失败？

**A:** 检查：
1. `NEXTAUTH_URL` 是否设置为生产环境 URL
2. OAuth 回调 URL 是否更新
3. `NEXTAUTH_SECRET` 是否设置

### Q: 构建失败？

**A:** 检查：
1. 所有依赖是否已安装
2. TypeScript 类型错误
3. 环境变量是否缺失

### Q: 如何查看生产环境日志？

**A:** 
- Vercel: 项目页面 → Deployments → 点击部署 → Logs
- Railway: 项目页面 → Deployments → 查看日志

---

## 性能优化建议

### 1. 启用 Prisma 连接池

在生产环境中，建议使用连接池：

```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

### 2. 配置 Next.js 缓存

在 `next.config.mjs` 中：

```javascript
export default {
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
}
```

### 3. 图片优化

- 使用 Next.js Image 组件
- 配置图片 CDN（如 Cloudinary）

---

## 监控和维护

### 1. 设置错误监控

推荐使用：
- [Sentry](https://sentry.io) - 错误追踪
- [Vercel Analytics](https://vercel.com/analytics) - 性能监控

### 2. 定期备份

- Vercel Postgres: 自动备份
- Supabase: 手动备份或使用 Supabase CLI

### 3. 更新依赖

```bash
# 检查过时的依赖
pnpm outdated

# 更新依赖
pnpm update
```

---

## 成本估算

### Vercel（免费计划）
- ✅ 100GB 带宽/月
- ✅ 无限请求
- ✅ 自动 HTTPS
- ✅ 全球 CDN

### Vercel Postgres（Hobby 计划）
- ✅ 256MB 存储
- ✅ 60 小时计算/月
- ✅ 适合小型项目

### Supabase（免费计划）
- ✅ 500MB 数据库
- ✅ 2GB 带宽/月
- ✅ 50,000 月活用户

---

## 快速部署命令

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 拉取环境变量
vercel env pull .env.local

# 5. 初始化数据库
pnpm db:push

# 6. 生产环境部署
vercel --prod
```

---

## 相关文档

- [Vercel 部署文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

