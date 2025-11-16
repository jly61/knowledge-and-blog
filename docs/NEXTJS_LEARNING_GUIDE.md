# Next.js 学习指南

## 目录

1. [Next.js 是什么？](#nextjs-是什么)
2. [App Router vs Pages Router](#app-router-vs-pages-router)
3. [文件系统路由](#文件系统路由)
4. [路由组（括号文件夹）](#路由组括号文件夹)
5. [核心概念](#核心概念)
6. [实际项目结构解析](#实际项目结构解析)

---

## Next.js 是什么？

Next.js 是一个基于 React 的全栈框架，提供了：

- **服务端渲染（SSR）**：在服务器上渲染页面
- **静态生成（SSG）**：构建时生成静态页面
- **API Routes**：创建后端 API
- **文件系统路由**：通过文件结构自动创建路由
- **自动代码分割**：优化性能

---

## App Router vs Pages Router

### Pages Router（旧版，Next.js 12 及之前）

```
pages/
  ├── index.js          → /
  ├── about.js          → /about
  ├── blog/
  │   └── [id].js       → /blog/:id
  └── api/
      └── users.js      → /api/users
```

### App Router（新版，Next.js 13+，我们使用的）

```
app/
  ├── page.tsx          → /
  ├── about/
  │   └── page.tsx      → /about
  ├── blog/
  │   └── [id]/
  │       └── page.tsx  → /blog/:id
  └── api/
      └── users/
          └── route.ts  → /api/users
```

**主要区别：**
- App Router 使用 `page.tsx` 定义页面
- App Router 使用 `route.ts` 定义 API
- App Router 支持 React Server Components
- App Router 支持嵌套布局

---

## 文件系统路由

### 基本规则

在 `app` 目录中，文件结构直接对应 URL 路径：

```
app/
  ├── page.tsx              → http://localhost:3000/
  ├── about/
  │   └── page.tsx          → http://localhost:3000/about
  ├── blog/
  │   ├── page.tsx         → http://localhost:3000/blog
  │   └── [id]/
  │       └── page.tsx      → http://localhost:3000/blog/123
  └── contact/
      └── page.tsx          → http://localhost:3000/contact
```

### 特殊文件

| 文件名 | 作用 |
|--------|------|
| `page.tsx` | 定义页面（路由） |
| `layout.tsx` | 定义布局（共享 UI） |
| `loading.tsx` | 加载状态 UI |
| `error.tsx` | 错误页面 |
| `not-found.tsx` | 404 页面 |
| `route.ts` | API 路由 |

---

## 路由组（括号文件夹）

### 什么是路由组？

**括号文件夹 `(folderName)` 不会出现在 URL 中**，只用于组织代码和共享布局。

### 为什么使用路由组？

1. **组织代码**：将相关路由分组
2. **共享布局**：同一组内的路由共享布局
3. **不影响 URL**：URL 路径保持简洁

### 示例对比

#### 不使用路由组（URL 会包含文件夹名）

```
app/
  ├── dashboard/
  │   ├── layout.tsx
  │   └── notes/
  │       └── page.tsx      → /dashboard/notes
  └── blog/
      ├── layout.tsx
      └── page.tsx          → /blog
```

#### 使用路由组（URL 不包含括号文件夹）

```
app/
  ├── (dashboard)/
  │   ├── layout.tsx        ← 只影响组内路由
  │   └── notes/
  │       └── page.tsx      → /notes（不是 /dashboard/notes）
  └── (blog)/
      ├── layout.tsx        ← 只影响组内路由
      └── page.tsx          → /blog
```

### 实际项目中的路由组

让我们看看你的项目结构：

```
app/
  ├── (auth)/              ← 路由组：认证相关
  │   └── login/
  │       └── page.tsx     → /login（不是 /auth/login）
  │
  ├── (dashboard)/         ← 路由组：仪表板（需要登录）
  │   ├── layout.tsx       ← 共享布局：导航栏、侧边栏等
  │   ├── dashboard/
  │   │   └── page.tsx     → /dashboard
  │   └── notes/
  │       └── page.tsx     → /notes（不是 /dashboard/notes）
  │
  ├── (blog)/              ← 路由组：博客（公开）
  │   ├── layout.tsx       ← 共享布局：博客导航
  │   └── page.tsx         → /blog
  │
  ├── layout.tsx           ← 根布局：所有页面共享
  └── page.tsx             → /（首页）
```

### 路由组的布局嵌套

布局会嵌套，从外到内：

```
根布局 (app/layout.tsx)
  └── 博客布局 (app/(blog)/layout.tsx)
      └── 博客页面 (app/(blog)/page.tsx)
```

**实际渲染：**
```tsx
// app/layout.tsx
<html>
  <body>
    {/* 根布局内容 */}
    
    {/* app/(blog)/layout.tsx */}
    <header>博客导航</header>
    
    {/* app/(blog)/page.tsx */}
    <main>博客内容</main>
  </body>
</html>
```

---

## 核心概念

### 1. Server Components（服务端组件）

**默认情况下，所有组件都是 Server Components**

```tsx
// app/page.tsx - Server Component
export default async function HomePage() {
  // 可以直接访问数据库，无需 API
  const data = await db.note.findMany()
  
  return <div>{/* 渲染数据 */}</div>
}
```

**特点：**
- 在服务器上运行
- 可以直接访问数据库
- 不发送到客户端（减少 JS 体积）
- 不能使用浏览器 API（如 `useState`, `onClick`）

### 2. Client Components（客户端组件）

**需要交互时使用 `'use client'`**

```tsx
'use client'  // ← 必须添加这个指令

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      点击 {count}
    </button>
  )
}
```

**特点：**
- 在客户端运行
- 可以使用 React Hooks
- 可以处理用户交互
- 会发送到客户端（增加 JS 体积）

### 3. Layout（布局）

**布局会包裹子路由，保持状态**

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,  // ← 子页面内容
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <nav>导航栏</nav>
      <main>{children}</main>  {/* 子页面在这里渲染 */}
      <footer>页脚</footer>
    </div>
  )
}
```

**特点：**
- 共享 UI（导航、侧边栏等）
- 保持状态（切换路由时不会重新渲染）
- 可以嵌套

### 4. Server Actions（服务端操作）

**在 Server Component 中直接操作数据库**

```tsx
// app/actions/notes.ts
'use server'  // ← 标记为 Server Action

export async function createNote(data: FormData) {
  // 直接操作数据库，无需 API Route
  await db.note.create({
    data: {
      title: data.get('title'),
      content: data.get('content'),
    }
  })
}
```

**使用：**
```tsx
// app/page.tsx
import { createNote } from '@/app/actions/notes'

export default function Page() {
  return (
    <form action={createNote}>
      <input name="title" />
      <button type="submit">提交</button>
    </form>
  )
}
```

---

## 实际项目结构解析

### 你的项目结构

```
app/
├── (auth)/                    # 路由组：认证相关
│   └── login/
│       └── page.tsx          → /login
│
├── (dashboard)/              # 路由组：仪表板（需要登录）
│   ├── layout.tsx           # 共享布局：仪表板导航
│   ├── dashboard/
│   │   └── page.tsx         → /dashboard
│   └── notes/
│       ├── page.tsx         → /notes
│       ├── new/
│       │   └── page.tsx     → /notes/new
│       └── [id]/
│           ├── page.tsx     → /notes/123
│           └── edit/
│               └── page.tsx → /notes/123/edit
│
├── (blog)/                   # 路由组：博客（公开）
│   ├── layout.tsx           # 共享布局：博客导航
│   └── page.tsx             → /blog
│
├── actions/                  # Server Actions（不是路由）
│   └── notes.ts
│
├── api/                      # API Routes
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts     → /api/auth/[...]
│
├── layout.tsx                # 根布局：所有页面共享
├── page.tsx                  # 首页 → /
└── globals.css               # 全局样式
```

### URL 路径映射

| 文件路径 | URL 路径 |
|---------|---------|
| `app/page.tsx` | `/` |
| `app/(auth)/login/page.tsx` | `/login` |
| `app/(dashboard)/dashboard/page.tsx` | `/dashboard` |
| `app/(dashboard)/notes/page.tsx` | `/notes` |
| `app/(dashboard)/notes/new/page.tsx` | `/notes/new` |
| `app/(dashboard)/notes/[id]/page.tsx` | `/notes/123` |
| `app/(blog)/page.tsx` | `/blog` |
| `app/api/auth/[...nextauth]/route.ts` | `/api/auth/*` |

**注意：** `(auth)`, `(dashboard)`, `(blog)` 不会出现在 URL 中！

---

## 动态路由

### 单个参数

```tsx
// app/blog/[id]/page.tsx
export default function BlogPost({ params }: { params: { id: string } }) {
  return <div>博客 ID: {params.id}</div>
}
```

**URL:** `/blog/123` → `params.id = "123"`

### 多个参数

```tsx
// app/shop/[category]/[product]/page.tsx
export default function Product({ params }: { 
  params: { category: string; product: string } 
}) {
  return <div>{params.category} - {params.product}</div>
}
```

**URL:** `/shop/electronics/phone` → `params = { category: "electronics", product: "phone" }`

### 捕获所有路由

```tsx
// app/docs/[...slug]/page.tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  return <div>路径: {params.slug.join('/')}</div>
}
```

**URL:** `/docs/getting-started/installation` → `params.slug = ["getting-started", "installation"]`

---

## 布局嵌套示例

### 你的项目布局嵌套

```
app/layout.tsx (根布局)
  ├── HTML 结构
  ├── 全局样式
  └── Providers（SessionProvider, QueryClientProvider）
      │
      ├── app/(dashboard)/layout.tsx (仪表板布局)
      │   ├── 导航栏
      │   ├── 侧边栏
      │   └── children (仪表板页面)
      │       ├── /dashboard
      │       ├── /notes
      │       └── /notes/123
      │
      └── app/(blog)/layout.tsx (博客布局)
          ├── 博客导航
          └── children (博客页面)
              └── /blog
```

---

## 常见问题

### Q: 为什么有些文件夹有括号，有些没有？

**A:** 
- **有括号** `(folder)` = 路由组，不出现在 URL 中，用于组织代码
- **无括号** `folder` = 正常路由，会出现在 URL 中

### Q: 什么时候使用路由组？

**A:** 当你需要：
1. 为多个路由共享布局
2. 组织相关路由
3. 但不想在 URL 中显示文件夹名

### Q: Server Component 和 Client Component 的区别？

**A:**
- **Server Component**（默认）：在服务器运行，可以直接访问数据库，不能使用 Hooks
- **Client Component**（`'use client'`）：在浏览器运行，可以使用 Hooks，可以交互

### Q: 如何选择使用哪个？

**A:**
- **默认用 Server Component**（性能更好）
- **需要交互时用 Client Component**（按钮点击、表单输入等）

### Q: layout.tsx 和 page.tsx 的区别？

**A:**
- **layout.tsx**：共享 UI，切换路由时不会重新渲染
- **page.tsx**：页面内容，每个路由都有

---

## 学习路径建议

### 1. 基础阶段
- ✅ 理解文件系统路由
- ✅ 理解 Server Components
- ✅ 理解 Layout 和 Page

### 2. 进阶阶段
- ✅ 理解路由组
- ✅ 理解动态路由
- ✅ 理解 Server Actions

### 3. 高级阶段
- ✅ 理解数据获取模式
- ✅ 理解缓存和重新验证
- ✅ 理解中间件

---

## 实践建议

1. **修改路由**：尝试添加新页面，观察 URL 变化
2. **修改布局**：在 layout.tsx 中添加内容，观察所有子页面
3. **创建路由组**：尝试创建新的路由组，理解布局嵌套
4. **使用 Server Actions**：尝试创建表单，使用 Server Actions 提交

---

## 参考资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [App Router 文档](https://nextjs.org/docs/app)
- [路由组文档](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

## 总结

**核心要点：**

1. **文件结构 = URL 路径**（除了括号文件夹）
2. **括号文件夹 = 路由组**（不出现在 URL，用于组织代码）
3. **默认是 Server Component**（性能更好）
4. **需要交互时用 `'use client'`**
5. **Layout 共享 UI，Page 是页面内容**

希望这个指南能帮助你理解 Next.js！有问题随时问我。

