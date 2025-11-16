# 快速开始指南

## 项目当前状态

✅ **已完成：**
- 项目规划文档（PROJECT_PLAN.md）
- 数据库 Schema 设计（Prisma）
- 项目基础配置（TypeScript, Tailwind, Next.js）
- 核心工具函数（链接解析、图谱生成、工具函数）
- 类型定义
- 实现指南文档

⏳ **待实现：**
- 认证系统（NextAuth.js）
- 笔记管理功能
- 双向链接系统
- 知识图谱可视化
- 博客发布功能
- UI 组件

## 第一步：环境准备

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

参考 [ENV_SETUP.md](./ENV_SETUP.md) 创建 `.env.local` 文件

**最小配置：**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_blog"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="生成一个随机字符串"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送 Schema 到数据库（开发环境）
pnpm db:push

# 或使用迁移（推荐生产环境）
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 第二步：实现核心功能

按照以下顺序逐步实现：

### 阶段 1：基础框架（1-2天）

1. **设置 NextAuth.js**
   - 参考 `IMPLEMENTATION_GUIDE.md` 中的认证系统部分
   - 创建 `lib/auth.ts`
   - 创建 `app/api/auth/[...nextauth]/route.ts`
   - 创建登录/注册页面

2. **安装 shadcn/ui 组件**
   ```bash
   pnpm dlx shadcn-ui@latest init
   pnpm dlx shadcn-ui@latest add button input card dialog form
   ```

3. **创建基础布局**
   - `app/layout.tsx` - 根布局
   - `app/(dashboard)/layout.tsx` - 仪表板布局
   - `app/(blog)/layout.tsx` - 博客布局

### 阶段 2：笔记管理（3-5天）

1. **笔记 CRUD**
   - 创建笔记页面
   - 编辑笔记页面
   - 笔记列表页面
   - Server Actions（`app/actions/notes.ts`）

2. **Markdown 编辑器**
   - 集成 Tiptap 或 Monaco Editor
   - 实现实时预览
   - 支持 `[[双向链接]]` 语法

3. **分类和标签**
   - 分类管理
   - 标签管理
   - 笔记关联

### 阶段 3：双向链接（2-3天）

1. **链接解析**
   - 使用已有的 `lib/markdown/parseLinks.ts`
   - 在编辑器中实时解析
   - 显示链接建议

2. **链接关系管理**
   - 创建 NoteLink 记录
   - 显示反链（反向链接）
   - 链接预览

### 阶段 4：知识图谱（2-3天）

1. **图谱数据生成**
   - 使用已有的 `lib/graph.ts`
   - 创建 API 路由 `/api/graph`

2. **图谱可视化**
   - 集成 vis-network
   - 实现节点交互
   - 支持筛选和搜索

### 阶段 5：博客功能（3-5天）

1. **文章发布**
   - 笔记转文章功能
   - SEO 元数据管理
   - 文章编辑

2. **博客展示**
   - 文章列表
   - 文章详情页
   - 分类和标签页面
   - RSS 订阅

3. **评论系统**
   - 评论 CRUD
   - 评论审核
   - 回复功能

### 阶段 6：高级功能（可选）

- 每日笔记
- MOC 管理
- 全文搜索优化
- 数据导入/导出
- 性能优化

## 开发建议

### 1. 使用 Server Components

优先使用 Server Components 获取数据，减少客户端 JavaScript：

```typescript
// ✅ 推荐：Server Component
export default async function NotesPage() {
  const notes = await db.note.findMany()
  return <NoteList notes={notes} />
}

// ❌ 避免：不必要的 Client Component
'use client'
export default function NotesPage() {
  const [notes, setNotes] = useState([])
  useEffect(() => {
    fetch('/api/notes').then(...)
  }, [])
  // ...
}
```

### 2. 使用 Server Actions

对于数据修改操作，使用 Server Actions 而不是 API Routes：

```typescript
// ✅ 推荐：Server Action
'use server'
export async function createNote(data: FormData) {
  await db.note.create({...})
}

// ❌ 避免：API Route（除非需要特殊处理）
```

### 3. 错误处理

始终添加错误处理和用户反馈：

```typescript
try {
  await createNote(data)
  toast.success('笔记创建成功')
} catch (error) {
  toast.error('创建失败：' + error.message)
}
```

### 4. 类型安全

充分利用 TypeScript 类型：

```typescript
import { NoteWithRelations } from '@/types/note'

function NoteCard({ note }: { note: NoteWithRelations }) {
  // TypeScript 会提供完整的类型提示
}
```

## 参考文档

- **项目规划**: [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- **实现指南**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **环境配置**: [ENV_SETUP.md](./ENV_SETUP.md)
- **Next.js 文档**: https://nextjs.org/docs
- **Prisma 文档**: https://www.prisma.io/docs
- **shadcn/ui**: https://ui.shadcn.com

## 常见问题

### Q: 数据库连接失败？

A: 检查 `DATABASE_URL` 是否正确，确保 PostgreSQL 服务正在运行。

### Q: NextAuth 报错？

A: 确保 `NEXTAUTH_SECRET` 已设置，并且 `NEXTAUTH_URL` 与当前访问地址一致。

### Q: Prisma 迁移失败？

A: 开发环境可以使用 `pnpm db:push` 直接推送，生产环境使用 `pnpm db:migrate`。

### Q: 如何添加新的 shadcn/ui 组件？

A: 运行 `pnpm dlx shadcn-ui@latest add [component-name]`

## 下一步

1. 按照本指南完成环境配置
2. 参考 `IMPLEMENTATION_GUIDE.md` 逐步实现功能
3. 遇到问题查看相关文档或搜索解决方案
4. 完成基础功能后，可以开始优化和添加高级功能

祝你开发顺利！🚀

