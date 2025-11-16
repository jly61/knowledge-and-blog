# 数据库设置指南

## 问题：缺少 DATABASE_URL 环境变量

如果遇到 `Environment variable not found: DATABASE_URL` 错误，说明还没有创建 `.env.local` 文件。

## 快速解决

### 方法 1：使用本地 PostgreSQL（推荐用于开发）

#### 1. 安装 PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**或使用 Docker:**
```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
```

#### 2. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE knowledge_blog;

# 退出
\q
```

#### 3. 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件：

```env
# 数据库连接（根据你的实际配置修改）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_blog?schema=public"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ga4zqiHo7LUjhR2Vf/vIYKmZa6IT2aCKNT57T0JODUs="
```

**注意：** 将 `postgres:postgres` 替换为你的 PostgreSQL 用户名和密码。

### 方法 2：使用 Supabase（免费，推荐用于快速开始）

#### 1. 注册 Supabase 账号

访问 [https://supabase.com](https://supabase.com) 并注册账号。

#### 2. 创建新项目

1. 点击 "New Project"
2. 填写项目信息
3. 等待项目创建完成（约 2 分钟）

#### 3. 获取数据库连接字符串

1. 进入项目设置（Settings）
2. 点击 "Database"
3. 找到 "Connection string"
4. 选择 "URI" 格式
5. 复制连接字符串（类似：`postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`）

#### 4. 创建 `.env.local` 文件

```env
# 数据库连接（使用 Supabase 的连接字符串）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?schema=public"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ga4zqiHo7LUjhR2Vf/vIYKmZa6IT2aCKNT57T0JODUs="
```

**注意：** 将 `[YOUR-PASSWORD]` 替换为你的 Supabase 数据库密码。

### 方法 3：使用 Vercel Postgres（推荐用于生产环境）

如果你计划部署到 Vercel，可以使用 Vercel Postgres：

1. 在 Vercel 项目中添加 Postgres 数据库
2. Vercel 会自动配置 `DATABASE_URL` 环境变量

## 创建 .env.local 文件的步骤

### 在终端中创建：

```bash
# 进入项目目录
cd /Users/liw/Devloper/WebStormProject/cursor-project/BigFE

# 创建 .env.local 文件
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_blog?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ga4zqiHo7LUjhR2Vf/vIYKmZa6IT2aCKNT57T0JODUs="
EOF
```

### 或使用编辑器：

1. 在项目根目录创建新文件 `.env.local`
2. 复制上面的内容
3. 根据你的数据库配置修改 `DATABASE_URL`

## 验证配置

创建 `.env.local` 后，运行：

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库 Schema
pnpm db:push
```

如果成功，你会看到类似这样的输出：
```
✔ Your database is now in sync with your Prisma schema.
```

## 常见问题

### Q: 如何找到 PostgreSQL 的用户名和密码？

**本地安装的 PostgreSQL:**
- 默认用户名：`postgres` 或你的系统用户名
- 默认密码：安装时设置的密码，或为空

**Docker PostgreSQL:**
- 用户名：`postgres`
- 密码：启动容器时设置的密码（如 `-e POSTGRES_PASSWORD=postgres`）

### Q: 连接被拒绝怎么办？

1. 确保 PostgreSQL 服务正在运行：
   ```bash
   # macOS
   brew services list
   
   # 或检查 Docker 容器
   docker ps
   ```

2. 检查端口是否正确（默认 5432）

3. 检查防火墙设置

### Q: 数据库不存在怎么办？

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE knowledge_blog;

# 退出
\q
```

### Q: 可以使用 SQLite 吗？

可以，但需要修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**注意：** SQLite 不支持某些 PostgreSQL 特性（如全文搜索），建议使用 PostgreSQL。

## 下一步

配置好 `.env.local` 后：

1. 运行 `pnpm db:generate` 生成 Prisma Client
2. 运行 `pnpm db:push` 创建数据库表
3. 运行 `pnpm dev` 启动开发服务器

