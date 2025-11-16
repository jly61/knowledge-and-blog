# 环境变量配置说明

## 必需的环境变量

创建 `.env.local` 文件（此文件不会被提交到 Git）：

```env
# 数据库连接
# 本地开发使用 PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_blog?schema=public"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-a-random-string"
```

## 可选的环境变量

### OAuth 登录（GitHub/Google）

```env
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 文件上传

```env
# Cloudinary（推荐）
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# 或使用 AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

### Redis（缓存和会话）

```env
REDIS_URL="redis://localhost:6379"
```

### 邮件服务（通知功能）

```env
RESEND_API_KEY="your-resend-api-key"
```

## 生成 NEXTAUTH_SECRET

可以使用以下命令生成一个安全的密钥：

```bash
openssl rand -base64 32
```

或使用 Node.js：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 数据库设置

### 本地 PostgreSQL

1. 安装 PostgreSQL
2. 创建数据库：
```sql
CREATE DATABASE knowledge_blog;
```
3. 更新 `DATABASE_URL` 中的用户名和密码

### 使用 Supabase（推荐用于开发）

1. 在 [Supabase](https://supabase.com) 创建项目
2. 获取连接字符串
3. 更新 `DATABASE_URL`

### 使用 Vercel Postgres（生产环境）

1. 在 Vercel 项目中添加 Postgres 数据库
2. 自动配置 `DATABASE_URL`

## 开发环境快速启动

1. 复制环境变量模板：
```bash
cp ENV_SETUP.md .env.local
# 然后编辑 .env.local 填入实际值
```

2. 安装依赖：
```bash
pnpm install
```

3. 初始化数据库：
```bash
pnpm db:push
```

4. 启动开发服务器：
```bash
pnpm dev
```

