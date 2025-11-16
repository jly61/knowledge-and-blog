# 个人知识库 + 博客系统

一个集成了个人知识库管理和技术博客发布的全栈应用系统。

## 功能特性

### 📝 知识库模式（私有）
- 笔记管理（创建、编辑、删除）
- 双向链接系统（`[[笔记标题]]`）
- 知识图谱可视化
- 每日笔记
- MOC (Map of Contents) 索引
- 全文搜索

### 📰 博客模式（公开）
- 从笔记发布为文章
- 文章管理和展示
- SEO 优化
- 评论系统
- RSS 订阅

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL + Prisma
- **认证**: NextAuth.js v5
- **编辑器**: Tiptap
- **图谱**: vis-network

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_blog?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth (可选)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 运行数据库迁移
pnpm db:migrate

# 或直接推送 schema（开发环境）
pnpm db:push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
knowledge-blog/
├── app/              # Next.js App Router
├── components/       # React 组件
├── lib/             # 工具函数
├── prisma/          # Prisma schema
└── public/          # 静态资源
```

## 文档

- **项目规划**: [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- **快速开始**: [QUICK_START.md](./QUICK_START.md)
- **开发状态**: [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)
- **完整文档**: [docs/README.md](./docs/README.md) - 所有技术文档和学习指南

### 技术文档（docs/）

- [NextAuth.js v5 教程](./docs/nextauth-v5-guide.md)
- [Next.js 学习指南](./docs/NEXTJS_LEARNING_GUIDE.md)
- [Prisma Schema 详解](./docs/PRISMA_SCHEMA_EXPLAINED.md)
- [OAuth 设置指南](./docs/QUICK_OAUTH_SETUP.md)
- [数据库设置指南](./docs/SETUP_DATABASE.md)
- [实现指南](./docs/IMPLEMENTATION_GUIDE.md)

## 许可证

MIT

