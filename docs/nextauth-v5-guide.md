# NextAuth.js v5 完整教程

## 目录

1. [NextAuth.js 是什么？](#nextauthjs-是什么)
2. [v4 vs v5 的主要变化](#v4-vs-v5-的主要变化)
3. [核心 API 详解](#核心-api-详解)
4. [实际使用示例](#实际使用示例)
5. [会话策略](#会话策略)
6. [回调函数](#回调函数)
7. [常见使用场景](#常见使用场景)
8. [数据流](#数据流)
9. [最佳实践](#最佳实践)

---

## NextAuth.js 是什么？

NextAuth.js 是 Next.js 的认证库，用于：
- 用户登录/登出
- OAuth 登录（GitHub、Google 等）
- 会话管理
- 保护路由

---

## v4 vs v5 的主要变化

### 1. 配置方式变化

#### v4 的写法（旧）
```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [...],
  // ...
}

// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### v5 的写法（新）
```typescript
// lib/auth.ts
import NextAuth from "next-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [...],
  // ...
})

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

**变化：**
- 不再需要单独的 `authOptions` 对象
- 直接调用 `NextAuth()` 并解构导出
- 自动生成 `handlers`、`auth`、`signIn`、`signOut`

---

### 2. 获取会话的方式变化

#### v4 的写法
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const session = await getServerSession(authOptions)
```

#### v5 的写法
```typescript
import { auth } from "@/lib/auth"

const session = await auth()
```

**变化：**
- 不再需要 `getServerSession`
- 直接使用导出的 `auth()` 函数
- 不需要传递 `authOptions`

---

### 3. Middleware 的变化

#### v4 的写法
```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})
```

#### v5 的写法
```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
})
```

**变化：**
- 不再使用 `withAuth`
- 使用 `auth()` 作为 middleware 函数
- 使用 Next.js 的 `NextResponse` 处理重定向

---

## 核心 API 详解

### 1. `auth()` - 获取服务端会话

**用途：** 在 Server Component 或 Server Action 中获取当前用户

```typescript
// lib/auth-server.ts
import { auth } from "@/lib/auth"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

// 使用
export default async function Page() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return <div>欢迎，{user.name}</div>
}
```

**返回的数据结构：**
```typescript
{
  user: {
    id: "user-id",
    email: "user@example.com",
    name: "用户名",
    image: "头像URL"
  },
  expires: "2024-01-01T00:00:00.000Z"
}
```

---

### 2. `signIn()` - 客户端登录

**用途：** 在 Client Component 中触发登录

```typescript
"use client"
import { signIn } from "next-auth/react"

export function LoginButton() {
  const handleLogin = async () => {
    // OAuth 登录
    await signIn("github", { callbackUrl: "/dashboard" })
    
    // 或邮箱密码登录
    await signIn("credentials", {
      email: "user@example.com",
      password: "password",
      callbackUrl: "/dashboard"
    })
  }
  
  return <button onClick={handleLogin}>登录</button>
}
```

**参数：**
- `provider`: OAuth 提供商名称（"github", "google"）或 "credentials"
- `options`: 
  - `callbackUrl`: 登录后重定向的 URL
  - `redirect`: 是否自动重定向（默认 true）

---

### 3. `signOut()` - 客户端登出

**用途：** 在 Client Component 中登出

```typescript
"use client"
import { signOut } from "next-auth/react"

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }
  
  return <button onClick={handleLogout}>登出</button>
}
```

---

### 4. `handlers` - API 路由处理器

**用途：** 处理认证相关的 API 请求

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

**自动处理的路由：**
- `GET /api/auth/signin` - 登录页面
- `POST /api/auth/signin/:provider` - 登录请求
- `GET /api/auth/callback/:provider` - OAuth 回调
- `GET /api/auth/signout` - 登出
- `GET /api/auth/session` - 获取会话
- `GET /api/auth/csrf` - CSRF token

---

## 实际使用示例

### 1. 配置（lib/auth.ts）

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  // 数据库适配器
  adapter: PrismaAdapter(db),
  
  // 认证提供商
  providers: [
    GitHubProvider({ ... }),
    GoogleProvider({ ... }),
  ],
  
  // 会话策略
  session: {
    strategy: "jwt",  // 或 "database"
  },
  
  // 回调函数
  callbacks: {
    async jwt({ token, user }) {
      // 自定义 JWT token
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // 自定义 session
      if (session.user) {
        session.user.id = token.id
      }
      return session
    },
  },
})
```

---

### 2. 服务端获取用户（lib/auth-server.ts）

```typescript
import { auth } from "@/lib/auth"

// 获取会话
export async function getSession() {
  return await auth()
}

// 获取当前用户
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}
```

---

### 3. 保护路由（middleware.ts）

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // req.auth 包含当前用户信息（如果已登录）
  if (!req.auth) {
    // 未登录，重定向到登录页
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 已登录，允许访问
  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*"],
}
```

---

### 4. 客户端登录（components/auth/sign-in.tsx）

```typescript
"use client"
import { signIn } from "next-auth/react"

export function SignIn() {
  const handleOAuthSignIn = async (provider: "github" | "google") => {
    await signIn(provider, { callbackUrl: "/dashboard" })
  }
  
  return (
    <button onClick={() => handleOAuthSignIn("github")}>
      使用 GitHub 登录
    </button>
  )
}
```

---

## 会话策略

### JWT 策略（你当前使用的）

```typescript
session: {
  strategy: "jwt"
}
```

**特点：**
- 会话信息存储在 JWT token 中
- 不需要数据库查询（快）
- 无法在服务端主动撤销会话
- 适合无状态应用

### Database 策略

```typescript
session: {
  strategy: "database"
}
```

**特点：**
- 会话信息存储在数据库中
- 可以主动撤销会话
- 需要数据库查询（稍慢）
- 适合需要会话管理的应用

---

## 回调函数（Callbacks）

### JWT Callback

在 JWT token 创建或更新时调用：

```typescript
callbacks: {
  async jwt({ token, user, account }) {
    // user: 首次登录时的用户信息
    // account: OAuth 账号信息
    // token: 当前的 JWT token
    
    if (user) {
      token.id = user.id
      token.email = user.email
    }
    
    return token
  },
}
```

### Session Callback

在会话创建时调用：

```typescript
callbacks: {
  async session({ session, token }) {
    // session: 要返回给客户端的会话对象
    // token: JWT token（包含你在 jwt callback 中添加的数据）
    
    if (session.user) {
      session.user.id = token.id as string
    }
    
    return session
  },
}
```

---

## 常见使用场景

### 场景 1：检查用户是否登录

```typescript
// Server Component
import { getCurrentUser } from "@/lib/auth-server"

export default async function Page() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }
  
  return <div>欢迎，{user.name}</div>
}
```

### 场景 2：根据用户显示不同内容

```typescript
export default async function Page() {
  const user = await getCurrentUser()
  
  return (
    <div>
      {user ? (
        <div>已登录：{user.email}</div>
      ) : (
        <div>未登录</div>
      )}
    </div>
  )
}
```

### 场景 3：保护 API 路由

```typescript
// app/api/notes/route.ts
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session) {
    return Response.json({ error: "未授权" }, { status: 401 })
  }
  
  // 处理请求...
}
```

---

## 数据流

### OAuth 登录流程

```
1. 用户点击 "使用 GitHub 登录"
   ↓
2. signIn("github") 被调用
   ↓
3. 重定向到 GitHub 授权页面
   ↓
4. 用户授权
   ↓
5. GitHub 重定向到 /api/auth/callback/github
   ↓
6. NextAuth 处理回调：
   - 使用授权码换取 access token
   - 获取用户信息
   - 调用 adapter 创建/更新用户
   - 创建会话
   ↓
7. 重定向到 callbackUrl (/dashboard)
   ↓
8. 在页面中使用 auth() 获取用户信息
```

---

## 重要概念总结

1. **`auth()`** = 服务端获取会话（替代 v4 的 `getServerSession`）
2. **`signIn()`** = 客户端触发登录
3. **`signOut()`** = 客户端登出
4. **`handlers`** = API 路由处理器
5. **`req.auth`** = middleware 中的用户信息

---

## 项目中的文件关系

```
lib/auth.ts
  ├── 导出 { handlers, auth, signIn, signOut }
  │
  ├── app/api/auth/[...nextauth]/route.ts
  │   └── 使用 handlers
  │
  ├── lib/auth-server.ts
  │   └── 使用 auth()
  │
  ├── middleware.ts
  │   └── 使用 auth()
  │
  └── components/auth/sign-in.tsx
      └── 使用 signIn() (从 next-auth/react)
```

---

## 快速参考

| 功能 | v4 | v5 |
|------|----|----|
| 配置 | `authOptions` | `NextAuth({...})` |
| 获取会话 | `getServerSession(authOptions)` | `auth()` |
| Middleware | `withAuth({...})` | `auth((req) => {...})` |
| API 路由 | `NextAuth(authOptions)` | `handlers` |
| 客户端登录 | `signIn()` | `signIn()` (不变) |

---

## 最佳实践

1. **服务端优先**：在 Server Component 中使用 `auth()`
2. **类型安全**：使用 TypeScript 类型
3. **错误处理**：检查 `session` 是否为 `null`
4. **重定向**：登录后重定向到原页面（使用 `callbackUrl`）

---

## 参考资源

- [NextAuth.js v5 官方文档](https://authjs.dev/)
- [迁移指南](https://authjs.dev/getting-started/migrating-to-v5)
- [NextAuth.js GitHub](https://github.com/nextauthjs/next-auth)

