# 功能实现指南

本文档提供了核心功能的实现思路和代码示例，帮助你逐步完成项目开发。

## 目录

1. [认证系统](#认证系统)
2. [笔记管理](#笔记管理)
3. [双向链接系统](#双向链接系统)
4. [知识图谱](#知识图谱)
5. [博客发布](#博客发布)
6. [搜索功能](#搜索功能)

---

## 认证系统

### 1. 配置 NextAuth.js

创建 `lib/auth.ts`:

```typescript
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
}
```

### 2. API Route Handler

创建 `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### 3. 中间件保护路由

创建 `middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*", "/api/notes/:path*"],
}
```

---

## 笔记管理

### 1. 创建笔记 Server Action

创建 `app/actions/notes.ts`:

```typescript
"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { parseLinks } from "@/lib/markdown/parseLinks"
import { revalidatePath } from "next/cache"

export async function createNote(data: {
  title: string
  content: string
  categoryId?: string
  tagIds?: string[]
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("未授权")
  }

  // 创建笔记
  const note = await db.note.create({
    data: {
      title: data.title,
      content: data.content,
      userId: session.user.id,
      categoryId: data.categoryId,
      tags: data.tagIds ? {
        connect: data.tagIds.map(id => ({ id }))
      } : undefined,
    },
  })

  // 解析并创建链接关系
  await updateNoteLinks(note.id, data.content)

  revalidatePath("/notes")
  return note
}

async function updateNoteLinks(noteId: string, content: string) {
  const links = parseLinks(content)
  
  // 删除旧链接
  await db.noteLink.deleteMany({
    where: { fromNoteId: noteId }
  })

  // 创建新链接
  for (const link of links) {
    // 查找目标笔记
    const targetNote = await db.note.findFirst({
      where: { title: { contains: link.text, mode: "insensitive" } }
    })

    if (targetNote) {
      await db.noteLink.create({
        data: {
          fromNoteId: noteId,
          toNoteId: targetNote.id,
          context: link.context,
          position: link.start,
        }
      })
    }
  }
}
```

### 2. 笔记列表页面

创建 `app/(dashboard)/notes/page.tsx`:

```typescript
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NoteCard } from "@/components/notes/NoteCard"

export default async function NotesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const notes = await db.note.findMany({
    where: { userId: session.user.id },
    include: {
      category: true,
      tags: true,
      _count: {
        select: {
          links: true,
          backlinks: true,
        }
      }
    },
    orderBy: [
      { isPinned: "desc" },
      { updatedAt: "desc" }
    ]
  })

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的笔记</h1>
        <Link href="/notes/new">新建笔记</Link>
      </div>
      <div className="grid gap-4">
        {notes.map(note => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}
```

---

## 双向链接系统

### 1. 链接解析和渲染

在笔记编辑器中，实时解析 `[[笔记标题]]` 并显示建议：

```typescript
// components/editor/LinkSuggestions.tsx
"use client"

import { useState, useEffect } from "react"
import { parseLinks } from "@/lib/markdown/parseLinks"

export function LinkSuggestions({ content, onLinkClick }: {
  content: string
  onLinkClick: (noteTitle: string) => void
}) {
  const links = parseLinks(content)
  const [suggestions, setSuggestions] = useState<Note[]>([])

  useEffect(() => {
    // 检查链接是否存在
    links.forEach(async (link) => {
      const note = await fetch(`/api/notes/search?q=${link.text}`)
      // 更新建议列表
    })
  }, [content])

  return (
    <div className="link-suggestions">
      {links.map(link => (
        <button
          key={link.start}
          onClick={() => onLinkClick(link.text)}
          className="link-button"
        >
          [[{link.text}]]
        </button>
      ))}
    </div>
  )
}
```

### 2. 反链显示

在笔记详情页显示所有链接到当前笔记的笔记：

```typescript
// components/notes/BacklinksPanel.tsx
export async function BacklinksPanel({ noteId }: { noteId: string }) {
  const backlinks = await db.noteLink.findMany({
    where: { toNoteId: noteId },
    include: {
      fromNote: {
        select: {
          id: true,
          title: true,
        }
      }
    }
  })

  if (backlinks.length === 0) {
    return null
  }

  return (
    <div className="backlinks-panel">
      <h3>反向链接</h3>
      <ul>
        {backlinks.map(link => (
          <li key={link.id}>
            <Link href={`/notes/${link.fromNote.id}`}>
              {link.fromNote.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 知识图谱

### 1. 图谱数据 API

创建 `app/api/graph/route.ts`:

```typescript
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { generateGraphData } from "@/lib/graph"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }

  const notes = await db.note.findMany({
    where: { userId: session.user.id },
    include: {
      links: {
        include: {
          toNote: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      },
      backlinks: {
        include: {
          fromNote: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      }
    }
  })

  const graphData = generateGraphData(notes)
  return Response.json(graphData)
}
```

### 2. 图谱可视化组件

创建 `components/graph/KnowledgeGraph.tsx`:

```typescript
"use client"

import { useEffect, useRef } from "react"
import { Network } from "vis-network"
import { GraphData } from "@/types/graph"

export function KnowledgeGraph({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const options = {
      nodes: {
        shape: "dot",
        size: 16,
        font: {
          size: 14,
        },
      },
      edges: {
        arrows: {
          to: { enabled: true },
        },
        smooth: {
          type: "continuous",
        },
      },
      physics: {
        stabilization: { iterations: 200 },
      },
    }

    const network = new Network(containerRef.current, data, options)

    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        window.location.href = `/notes/${nodeId}`
      }
    })

    return () => {
      network.destroy()
    }
  }, [data])

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border rounded-lg"
    />
  )
}
```

---

## 博客发布

### 1. 发布笔记为文章

创建 `app/actions/posts.ts`:

```typescript
"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { generateSlug, extractExcerpt } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function publishNoteAsPost(noteId: string, options?: {
  metaTitle?: string
  metaDescription?: string
  categoryId?: string
  tagIds?: string[]
}) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("未授权")
  }

  const note = await db.note.findUnique({
    where: { id: noteId, userId: session.user.id },
  })

  if (!note) {
    throw new Error("笔记不存在")
  }

  // 检查是否已发布
  if (note.postId) {
    // 更新现有文章
    const post = await db.post.update({
      where: { id: note.postId },
      data: {
        title: note.title,
        content: note.content,
        excerpt: options?.metaDescription || extractExcerpt(note.content),
        metaTitle: options?.metaTitle || note.title,
        metaDescription: options?.metaDescription || extractExcerpt(note.content),
        published: true,
        publishedAt: new Date(),
        categoryId: options?.categoryId,
        tags: options?.tagIds ? {
          set: options.tagIds.map(id => ({ id }))
        } : undefined,
      },
    })
    revalidatePath("/blog")
    return post
  }

  // 创建新文章
  const slug = generateSlug(note.title)
  const post = await db.post.create({
    data: {
      title: note.title,
      content: note.content,
      excerpt: options?.metaDescription || extractExcerpt(note.content),
      slug,
      metaTitle: options?.metaTitle || note.title,
      metaDescription: options?.metaDescription || extractExcerpt(note.content),
      published: true,
      publishedAt: new Date(),
      userId: session.user.id,
      noteId: note.id,
      categoryId: options?.categoryId,
      tags: options?.tagIds ? {
        connect: options.tagIds.map(id => ({ id }))
      } : undefined,
    },
  })

  // 更新笔记关联
  await db.note.update({
    where: { id: noteId },
    data: { postId: post.id },
  })

  revalidatePath("/blog")
  return post
}
```

### 2. 文章列表页面

创建 `app/(blog)/page.tsx`:

```typescript
import { db } from "@/lib/db"
import { PostCard } from "@/components/posts/PostCard"

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; tag?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const pageSize = 10

  const where = {
    published: true,
    ...(searchParams.category && {
      category: { slug: searchParams.category },
    }),
    ...(searchParams.tag && {
      tags: { some: { slug: searchParams.tag } },
    }),
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      include: {
        category: true,
        tags: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.post.count({ where }),
  ])

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">博客</h1>
      <div className="grid gap-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      {/* 分页组件 */}
    </div>
  )
}
```

---

## 搜索功能

### 1. 搜索 API

创建 `app/api/search/route.ts`:

```typescript
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const type = searchParams.get("type") || "all" // all, notes, posts

  if (!q) {
    return Response.json({ error: "缺少搜索关键词" }, { status: 400 })
  }

  const results = {
    notes: [] as any[],
    posts: [] as any[],
  }

  if (type === "all" || type === "notes") {
    if (session?.user) {
      results.notes = await db.note.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          category: true,
          tags: true,
        },
        take: 10,
      })
    }
  }

  if (type === "all" || type === "posts") {
    results.posts = await db.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
        tags: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      take: 10,
    })
  }

  return Response.json(results)
}
```

---

## 下一步

1. **安装依赖**: `pnpm install`
2. **配置数据库**: 设置 `.env.local` 并运行 `pnpm db:push`
3. **实现 UI 组件**: 使用 shadcn/ui 创建基础组件
4. **逐步实现功能**: 按照本文档的顺序实现各个功能模块
5. **测试和优化**: 完成功能后进行测试和性能优化

## 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [vis-network 文档](https://visjs.github.io/vis-network/docs/network/)

