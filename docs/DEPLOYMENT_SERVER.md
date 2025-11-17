# 云服务器部署指南

## 推荐方案：Docker Compose（最简单）

使用 Docker Compose 一键部署应用和数据库，适合小型云服务器。

---

## 🚀 方案 1：Docker Compose（推荐）

### 优点
- ✅ 一键部署，简单易用
- ✅ 包含 PostgreSQL 数据库
- ✅ 自动重启，稳定可靠
- ✅ 易于维护和更新

### 步骤

#### 1. 准备服务器

确保服务器已安装：
- Docker
- Docker Compose

```bash
# 安装 Docker（Ubuntu/Debian）
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 创建部署目录

```bash
# 在服务器上创建项目目录
mkdir -p /opt/knowledge-blog
cd /opt/knowledge-blog
```

#### 3. 创建 Docker Compose 配置

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: knowledge-blog-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
      POSTGRES_DB: knowledge_blog
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: knowledge-blog-app
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-changeme}@postgres:5432/knowledge_blog?schema=public
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID:-}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET:-}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: knowledge-blog-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 4. 创建 Dockerfile

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS base

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 复制 Prisma schema
COPY prisma ./prisma

# 生成 Prisma Client
RUN pnpm prisma generate

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产环境镜像
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制必要文件
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 5. 配置 Next.js 输出模式

更新 `next.config.mjs`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 启用独立输出模式
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
```

#### 6. 创建 Nginx 配置

创建 `nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # 重定向到 HTTPS（如果有 SSL）
        # return 301 https://$server_name$request_uri;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # HTTPS 配置（如果有 SSL 证书）
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #
    #     location / {
    #         proxy_pass http://app;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade $http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #         proxy_cache_bypass $http_upgrade;
    #     }
    # }
}
```

#### 7. 创建环境变量文件

创建 `.env`：

```env
# 数据库密码
DB_PASSWORD=your-secure-password

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=运行 openssl rand -base64 32 生成

# OAuth（可选）
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

#### 8. 部署步骤

```bash
# 1. 克隆代码到服务器
git clone your-repo-url /opt/knowledge-blog
cd /opt/knowledge-blog

# 2. 创建环境变量文件
cp .env.example .env
# 编辑 .env 文件，填入实际值

# 3. 启动服务
docker-compose up -d

# 4. 初始化数据库
docker-compose exec app pnpm db:push

# 5. 查看日志
docker-compose logs -f
```

#### 9. 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 运行数据库迁移（如果需要）
docker-compose exec app pnpm db:push
```

---

## 🔧 方案 2：直接部署（PM2 + Nginx）

适合想要更多控制权的用户。

### 步骤

#### 1. 安装依赖

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 安装 PM2
npm install -g pm2

# 安装 Nginx
sudo apt-get install nginx
```

#### 2. 配置 PostgreSQL

```bash
# 创建数据库
sudo -u postgres psql
CREATE DATABASE knowledge_blog;
CREATE USER knowledge_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE knowledge_blog TO knowledge_user;
\q
```

#### 3. 部署应用

```bash
# 克隆代码
cd /opt
git clone your-repo-url knowledge-blog
cd knowledge-blog

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
pnpm db:push

# 构建应用
pnpm build

# 使用 PM2 启动
pm2 start npm --name "knowledge-blog" -- start
pm2 save
pm2 startup
```

#### 4. 配置 Nginx

创建 `/etc/nginx/sites-available/knowledge-blog`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/knowledge-blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置 SSL（可选，推荐）

使用 Let's Encrypt：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 📊 方案对比

| 特性 | Docker Compose | 直接部署 |
|------|---------------|---------|
| 部署难度 | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 维护成本 | ⭐⭐ 低 | ⭐⭐⭐ 中等 |
| 资源占用 | ⭐⭐⭐ 较高 | ⭐⭐ 较低 |
| 隔离性 | ✅ 好 | ❌ 一般 |
| 扩展性 | ✅ 好 | ⚠️ 一般 |

**推荐：** 小型云服务器建议使用 **Docker Compose** 方案，更简单易维护。

---

## 🔒 安全建议

### 1. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. 数据库安全

- 使用强密码
- 限制数据库只允许本地连接
- 定期备份数据库

### 3. 环境变量安全

- 不要将 `.env` 文件提交到 Git
- 使用强密码和密钥
- 定期轮换密钥

---

## 📦 服务器资源要求

### 最低配置
- CPU: 1 核
- 内存: 1GB
- 存储: 10GB
- 带宽: 1Mbps

### 推荐配置
- CPU: 2 核
- 内存: 2GB
- 存储: 20GB
- 带宽: 5Mbps

---

## 🔄 更新和维护

### 更新应用

**Docker Compose:**
```bash
git pull
docker-compose up -d --build
docker-compose exec app pnpm db:push
```

**直接部署:**
```bash
git pull
pnpm install
pnpm build
pm2 restart knowledge-blog
```

### 备份数据库

**Docker Compose:**
```bash
docker-compose exec postgres pg_dump -U postgres knowledge_blog > backup.sql
```

**直接部署:**
```bash
pg_dump -U knowledge_user knowledge_blog > backup.sql
```

### 查看日志

**Docker Compose:**
```bash
docker-compose logs -f app
```

**直接部署:**
```bash
pm2 logs knowledge-blog
```

---

## 🐛 常见问题

### Q: 应用无法启动？

**A:** 检查：
1. 数据库是否正常运行
2. 环境变量是否正确
3. 端口是否被占用
4. 查看日志：`docker-compose logs` 或 `pm2 logs`

### Q: 数据库连接失败？

**A:** 检查：
1. 数据库服务是否运行
2. `DATABASE_URL` 是否正确
3. 数据库用户权限
4. 防火墙设置

### Q: 如何查看资源使用情况？

**A:**
```bash
# Docker
docker stats

# 系统资源
htop
df -h
```

---

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Nginx 文档](https://nginx.org/en/docs/)

