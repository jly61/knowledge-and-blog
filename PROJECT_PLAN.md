# 个人知识库 + 博客系统 - 项目规划

## 项目概述

一个集成了个人知识库管理和技术博客发布的全栈应用系统。支持笔记的双向链接、知识图谱可视化，同时可以将笔记发布为博客文章。

## 核心特性

### 一、知识库模式（私有）

#### 1. 笔记管理
- ✅ 创建、编辑、删除笔记
- ✅ Markdown 编辑器（支持语法高亮）
- ✅ 笔记分类和标签
- ✅ 笔记模板系统
- ✅ 笔记版本历史
- ✅ 笔记搜索（全文搜索）
- ✅ 笔记收藏/置顶

#### 2. 双向链接系统
- ✅ `[[笔记标题]]` 语法支持
- ✅ 自动生成反链（反向链接）
- ✅ 链接预览（悬停显示）
- ✅ 断链检测（链接到不存在的笔记）
- ✅ 链接关系可视化

#### 3. 知识图谱
- ✅ 笔记关系图谱可视化
- ✅ 节点交互（点击跳转）
- ✅ 图谱筛选（按标签、分类）
- ✅ 图谱导出（图片）

#### 4. 每日笔记
- ✅ 每日自动创建笔记
- ✅ 快速记录想法
- ✅ 时间线视图
- ✅ 日历导航

#### 5. MOC (Map of Contents)
- ✅ 索引页管理
- ✅ 笔记组织中心
- ✅ 自定义导航结构

### 二、博客模式（公开）

#### 1. 文章管理
- ✅ 从笔记发布为文章
- ✅ 文章编辑和预览
- ✅ 文章草稿管理
- ✅ 文章发布/下架
- ✅ 文章 SEO 优化

#### 2. 内容展示
- ✅ 文章列表（分页）
- ✅ 文章详情页
- ✅ 文章分类和标签
- ✅ 文章归档（按年月）
- ✅ 相关文章推荐

#### 3. 社交功能
- ✅ 评论系统
- ✅ 点赞功能
- ✅ 阅读量统计
- ✅ 分享功能（社交媒体）

#### 4. SEO 优化
- ✅ 元数据管理
- ✅ 站点地图生成
- ✅ RSS 订阅
- ✅ 结构化数据（JSON-LD）
- ✅ 社交分享卡片（Open Graph）

### 三、核心功能

#### 1. 笔记 → 文章转换
- ✅ 一键发布笔记为文章
- ✅ 自动提取摘要
- ✅ 生成 SEO 友好的 slug
- ✅ 保持内容同步（可选）
- ✅ 文章独立编辑（不影响原笔记）

#### 2. 用户系统
- ✅ 用户注册/登录（NextAuth.js）
- ✅ 个人资料管理
- ✅ 权限控制（笔记私有，文章公开）
- ✅ OAuth 登录（GitHub, Google）

#### 3. 搜索功能
- ✅ 全局搜索（笔记 + 文章）
- ✅ 高级搜索（标签、分类、日期）
- ✅ 搜索历史
- ✅ 搜索高亮

#### 4. 数据管理
- ✅ 数据导出（Markdown, JSON）
- ✅ 数据导入（Markdown 文件）
- ✅ 备份和恢复
- ✅ 数据统计

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **UI 库**: React 18
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **编辑器**: Monaco Editor / CodeMirror
- **图表**: vis-network / D3.js (知识图谱)
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **表单**: React Hook Form + Zod

### 后端
- **运行时**: Node.js 18+
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: NextAuth.js v5
- **缓存**: Redis (可选)
- **文件存储**: 本地 / AWS S3 / Cloudinary

### 开发工具
- **语言**: TypeScript 5.x
- **代码检查**: ESLint
- **格式化**: Prettier
- **Git Hooks**: Husky
- **测试**: Vitest + Playwright

### 部署
- **平台**: Vercel
- **数据库**: Vercel Postgres / Supabase
- **CDN**: Vercel Edge Network

## 数据库设计

### 核心模型

#### User (用户)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  notes         Note[]
  posts         Post[]
  comments      Comment[]
}
```

#### Note (笔记)
```prisma
model Note {
  id          String   @id @default(uuid())
  title       String
  content     String   // Markdown 内容
  excerpt     String?  // 摘要
  isPrivate   Boolean  @default(true)
  isPinned    Boolean  @default(false)
  isFavorite  Boolean  @default(false)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  
  tags        Tag[]
  links       NoteLink[] @relation("FromNote")
  backlinks   NoteLink[] @relation("ToNote")
  
  // 关联的文章（如果已发布）
  postId      String?  @unique
  post        Post?
  
  // 每日笔记关联
  dailyNoteId String?
  dailyNote   DailyNote? @relation(fields: [dailyNoteId], references: [id])
  
  // 版本历史
  versions    NoteVersion[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([categoryId])
  @@fulltext([title, content])
}
```

#### Post (文章)
```prisma
model Post {
  id          String   @id @default(uuid())
  title       String
  content     String   // Markdown 内容
  excerpt     String?  // 摘要
  slug        String   @unique
  coverImage  String?  // 封面图
  
  published   Boolean  @default(false)
  publishedAt DateTime?
  
  // SEO
  metaTitle   String?
  metaDescription String?
  
  // 统计
  views       Int      @default(0)
  likes       Int      @default(0)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // 关联的笔记
  noteId      String?  @unique
  note        Note?
  
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  
  tags        Tag[]
  comments    Comment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([published, publishedAt])
  @@index([slug])
  @@fulltext([title, content])
}
```

#### NoteLink (笔记链接关系)
```prisma
model NoteLink {
  id          String   @id @default(uuid())
  
  fromNoteId  String
  fromNote    Note     @relation("FromNote", fields: [fromNoteId], references: [id])
  
  toNoteId    String
  toNote      Note     @relation("ToNote", fields: [toNoteId], references: [id])
  
  context     String?  // 链接出现的上下文
  position    Int?     // 在内容中的位置
  
  createdAt   DateTime @default(now())
  
  @@unique([fromNoteId, toNoteId])
  @@index([fromNoteId])
  @@index([toNoteId])
}
```

#### Category (分类)
```prisma
model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  color       String?  // 颜色标识
  
  notes       Note[]
  posts       Post[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Tag (标签)
```prisma
model Tag {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  color       String?  // 颜色标识
  
  notes       Note[]
  posts       Post[]
  
  createdAt   DateTime @default(now())
  
  @@index([slug])
}
```

#### DailyNote (每日笔记)
```prisma
model DailyNote {
  id          String   @id @default(uuid())
  date        DateTime @unique @db.Date
  content     String   // Markdown 内容
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  notes       Note[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, date])
  @@index([userId, date])
}
```

#### NoteVersion (笔记版本)
```prisma
model NoteVersion {
  id          String   @id @default(uuid())
  title       String
  content     String
  noteId      String
  note        Note     @relation(fields: [noteId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@index([noteId, createdAt])
}
```

#### Comment (评论)
```prisma
model Comment {
  id          String   @id @default(uuid())
  content     String
  authorName  String
  authorEmail String?
  authorUrl   String?
  
  postId      String
  post        Post     @relation(fields: [postId], references: [id])
  
  parentId    String?  // 回复的评论 ID
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  
  approved    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([postId])
  @@index([parentId])
}
```

#### Account & Session (NextAuth.js)
```prisma
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## 项目结构

```
knowledge-blog/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # 知识库管理（需要登录）
│   │   ├── notes/                # 笔记管理
│   │   │   ├── [id]/
│   │   │   └── edit/
│   │   ├── graph/                # 知识图谱
│   │   ├── daily/                # 每日笔记
│   │   └── moc/                  # MOC 索引
│   ├── (blog)/                   # 博客（公开）
│   │   ├── page.tsx              # 文章列表
│   │   ├── [slug]/               # 文章详情
│   │   ├── category/[slug]/      # 分类页面
│   │   ├── tag/[slug]/           # 标签页面
│   │   └── archive/              # 归档页面
│   ├── api/                      # API Routes
│   │   ├── notes/
│   │   ├── posts/
│   │   ├── search/
│   │   └── graph/
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
│
├── components/                    # 组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── editor/                   # 编辑器组件
│   │   ├── MarkdownEditor.tsx
│   │   └── LinkSuggestions.tsx
│   ├── graph/                    # 知识图谱组件
│   │   └── KnowledgeGraph.tsx
│   ├── notes/                    # 笔记相关组件
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   └── BacklinksPanel.tsx
│   ├── posts/                    # 文章相关组件
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   └── CommentSection.tsx
│   └── shared/                   # 共享组件
│       ├── SearchBar.tsx
│       └── TagList.tsx
│
├── lib/                          # 工具函数
│   ├── db.ts                     # Prisma Client
│   ├── auth.ts                   # NextAuth 配置
│   ├── utils.ts                  # 工具函数
│   ├── markdown.ts               # Markdown 处理
│   │   ├── parseLinks.ts         # 解析双向链接
│   │   ├── extractExcerpt.ts     # 提取摘要
│   │   └── generateSlug.ts       # 生成 slug
│   ├── search.ts                 # 搜索功能
│   └── graph.ts                  # 图谱生成
│
├── prisma/                       # Prisma 配置
│   ├── schema.prisma
│   └── migrations/
│
├── public/                       # 静态资源
│   ├── images/
│   └── icons/
│
├── types/                        # TypeScript 类型
│   ├── note.ts
│   ├── post.ts
│   └── graph.ts
│
├── hooks/                        # React Hooks
│   ├── useNotes.ts
│   ├── usePosts.ts
│   └── useGraph.ts
│
└── stores/                       # Zustand 状态管理
    ├── noteStore.ts
    └── uiStore.ts
```

## 核心功能实现方案

### 1. 双向链接解析

```typescript
// lib/markdown/parseLinks.ts
// 解析 [[笔记标题]] 格式的链接
// 提取链接关系
// 生成链接预览
```

**实现步骤：**
1. 使用正则表达式匹配 `[[笔记标题]]`
2. 查找或创建目标笔记
3. 创建 NoteLink 关系
4. 生成反链（反向链接）
5. 渲染时转换为可点击链接

### 2. 知识图谱生成

```typescript
// lib/graph.ts
// 从 NoteLink 生成图谱数据
// 计算节点位置
// 生成可视化数据
```

**实现步骤：**
1. 查询所有笔记和链接关系
2. 构建图数据结构
3. 使用 vis-network 或 D3.js 渲染
4. 支持节点交互和筛选

### 3. 笔记 → 文章转换

```typescript
// app/api/notes/[id]/publish/route.ts
// 将笔记发布为文章
// 生成 SEO 元数据
// 创建 Post 记录
```

**实现步骤：**
1. 复制笔记内容到文章
2. 生成 slug（URL 友好）
3. 提取摘要
4. 设置 SEO 元数据
5. 创建关联关系
6. 可选：保持同步或独立编辑

### 4. 全文搜索

```typescript
// lib/search.ts
// 使用 Prisma 全文搜索
// 或集成 Algolia/Meilisearch
```

**实现方案：**
- 方案一：PostgreSQL 全文搜索（简单）
- 方案二：Algolia（性能好，需付费）
- 方案三：Meilisearch（开源，自托管）

## 开发计划

### 第一阶段：基础搭建（1周）
- [ ] 项目初始化（Next.js + TypeScript）
- [ ] 数据库设计和迁移
- [ ] 认证系统（NextAuth.js）
- [ ] 基础 UI 组件（shadcn/ui）
- [ ] 路由结构搭建

### 第二阶段：知识库核心功能（2周）
- [ ] 笔记 CRUD
- [ ] Markdown 编辑器
- [ ] 双向链接解析
- [ ] 反链生成
- [ ] 笔记搜索

### 第三阶段：知识图谱（1周）
- [ ] 图谱数据生成
- [ ] 图谱可视化
- [ ] 节点交互

### 第四阶段：博客功能（1周）
- [ ] 文章发布
- [ ] 文章列表和详情
- [ ] SEO 优化
- [ ] RSS 订阅

### 第五阶段：高级功能（1周）
- [ ] 每日笔记
- [ ] MOC 管理
- [ ] 评论系统
- [ ] 数据导入/导出

### 第六阶段：优化和部署（1周）
- [ ] 性能优化
- [ ] 错误处理
- [ ] 测试
- [ ] 部署上线

## 部署方案

### 开发环境
- 本地 PostgreSQL
- 本地 Redis（可选）

### 生产环境
- **平台**: Vercel
- **数据库**: Vercel Postgres 或 Supabase
- **文件存储**: Cloudinary（图片）
- **CDN**: Vercel Edge Network

## 后续扩展功能

- [ ] 移动端 App（React Native）
- [ ] 浏览器插件（快速保存）
- [ ] AI 功能（自动标签、摘要生成）
- [ ] 协作功能（共享笔记）
- [ ] 模板市场
- [ ] 插件系统

