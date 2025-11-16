# GitHub 和 Google OAuth 登录设置指南

## 概述

NextAuth.js 支持多种 OAuth 提供商，包括 GitHub 和 Google。本指南将详细说明如何配置这两种登录方式。

---

## 第一步：创建 OAuth 应用

### 1. GitHub OAuth App

#### 步骤 1：创建 GitHub OAuth App

1. 访问 GitHub Settings → Developer settings
   - 链接：https://github.com/settings/developers

2. 点击 "OAuth Apps" → "New OAuth App"

3. 填写信息：
   ```
   Application name: 你的应用名称（如：Knowledge Blog）
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```

4. 点击 "Register application"

5. 生成 Client Secret：
   - 点击 "Generate a new client secret"
   - **重要：** 立即复制 Client ID 和 Client Secret（Secret 只显示一次）

#### 步骤 2：获取凭证

你会得到：
- **Client ID**：类似 `Iv1.8a61f9b3a7aba766`
- **Client Secret**：类似 `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2. Google OAuth App

#### 步骤 1：创建 Google Cloud 项目

1. 访问 Google Cloud Console
   - 链接：https://console.cloud.google.com/

2. 创建新项目或选择现有项目

3. 启用 Google+ API：
   - 导航到 "APIs & Services" → "Library"
   - 搜索 "Google+ API" 并启用

#### 步骤 2：创建 OAuth 2.0 凭证

1. 导航到 "APIs & Services" → "Credentials"

2. 点击 "Create Credentials" → "OAuth client ID"

3. 如果是第一次，需要先配置 OAuth consent screen：
   - 选择 "External"（个人项目）
   - 填写应用信息：
     ```
     App name: 你的应用名称
     User support email: 你的邮箱
     Developer contact: 你的邮箱
     ```
   - 点击 "Save and Continue"
   - 在 Scopes 页面，点击 "Save and Continue"
   - 在 Test users 页面，可以添加测试用户，点击 "Save and Continue"
   - 点击 "Back to Dashboard"

4. 创建 OAuth Client ID：
   - Application type: "Web application"
   - Name: "Knowledge Blog"
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```

5. 点击 "Create"

6. 复制凭证：
   - **Client ID**：类似 `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**：类似 `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

---

## 第二步：配置环境变量

### 更新 `.env.local` 文件

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_blog?schema=public"

# NextAuth.js 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# GitHub OAuth
GITHUB_CLIENT_ID="你的GitHub_Client_ID"
GITHUB_CLIENT_SECRET="你的GitHub_Client_Secret"

# Google OAuth
GOOGLE_CLIENT_ID="你的Google_Client_ID"
GOOGLE_CLIENT_SECRET="你的Google_Client_Secret"
```

### 同时更新 `.env` 文件（Prisma 需要）

```bash
cp .env.local .env
```

---

## 第三步：检查 NextAuth 配置

### 当前配置（lib/auth.ts）

你的配置应该已经包含了 GitHub 和 Google providers：

```typescript
import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // GitHub Provider
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // Google Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  // ... 其他配置
})
```

**说明：**
- 使用条件判断 `...()` 确保只有在环境变量存在时才添加 provider
- 这样即使没有配置 OAuth，应用也能正常运行

---

## 第四步：更新登录页面

### 检查 sign-in.tsx

你的登录组件应该已经包含了 OAuth 按钮：

```tsx
// components/auth/sign-in.tsx
"use client"

import { signIn } from "next-auth/react"

export function SignIn() {
  const handleOAuthSignIn = async (provider: "github" | "google") => {
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <div>
      {/* GitHub 登录按钮 */}
      {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID && (
        <button onClick={() => handleOAuthSignIn("github")}>
          使用 GitHub 登录
        </button>
      )}

      {/* Google 登录按钮 */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <button onClick={() => handleOAuthSignIn("google")}>
          使用 Google 登录
        </button>
      )}
    </div>
  )
}
```

**注意：** 客户端组件需要使用 `NEXT_PUBLIC_` 前缀的环境变量。

---

## 第五步：修复环境变量问题

### 问题

客户端组件无法直接访问服务器端环境变量（`GITHUB_CLIENT_ID`）。

### 解决方案

有两种方式：

#### 方案 1：使用 NEXT_PUBLIC_ 前缀（不推荐，会暴露密钥）

```env
# .env.local
NEXT_PUBLIC_GITHUB_CLIENT_ID="xxx"  # 不推荐，会暴露到客户端
```

#### 方案 2：在服务器端检查（推荐）

修改 `sign-in.tsx`，不检查环境变量，直接显示按钮：

```tsx
// components/auth/sign-in.tsx
"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignIn() {
  const handleOAuthSignIn = async (provider: "github" | "google") => {
    setIsLoading(true)
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <div>
      {/* 直接显示按钮，如果未配置会显示错误 */}
      <Button onClick={() => handleOAuthSignIn("github")}>
        使用 GitHub 登录
      </Button>
      
      <Button onClick={() => handleOAuthSignIn("google")}>
        使用 Google 登录
      </Button>
    </div>
  )
}
```

---

## 第六步：测试登录

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 访问登录页面

打开：http://localhost:3000/login

### 3. 点击登录按钮

- 点击 "使用 GitHub 登录" 或 "使用 Google 登录"
- 会被重定向到对应的 OAuth 提供商
- 授权后返回应用

### 4. 检查数据库

登录成功后，检查数据库：

```bash
pnpm db:studio
```

应该能看到：
- `User` 表中创建了新用户
- `Account` 表中创建了 OAuth 账号关联
- `Session` 表中创建了会话记录

---

## 常见问题

### Q: 登录后显示 "OAuthAccountNotLinked" 错误？

**A:** 这通常发生在：
- 用户使用不同的邮箱登录不同的 OAuth 提供商
- 解决方案：在 NextAuth 配置中添加 `allowDangerousEmailAccountLinking: true`（仅开发环境）

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  // ... 其他配置
  allowDangerousEmailAccountLinking: true,  // 仅开发环境
})
```

### Q: 重定向 URL 不匹配？

**A:** 确保 OAuth 应用中的回调 URL 与 NextAuth 配置一致：

- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

### Q: 生产环境配置？

**A:** 更新 OAuth 应用设置：

1. **GitHub:**
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/api/auth/callback/github`

2. **Google:**
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

3. **环境变量:**
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   ```

### Q: 如何获取用户信息？

**A:** 用户信息会自动保存到数据库：

```typescript
// 在 Server Component 中
import { getCurrentUser } from "@/lib/auth-server"

export default async function Page() {
  const user = await getCurrentUser()
  
  // user 包含：
  // - id: 用户 ID
  // - email: 邮箱
  // - name: 姓名
  // - image: 头像 URL
}
```

---

## 完整配置检查清单

- [ ] GitHub OAuth App 已创建
- [ ] Google OAuth App 已创建
- [ ] 环境变量已配置（`.env.local` 和 `.env`）
- [ ] NextAuth 配置包含 providers
- [ ] 登录页面包含 OAuth 按钮
- [ ] 回调 URL 配置正确
- [ ] 数据库连接正常
- [ ] 测试登录功能

---

## 下一步

配置完成后，你可以：

1. **自定义用户信息**：在 NextAuth callbacks 中添加逻辑
2. **添加更多 OAuth 提供商**：如 Twitter、Discord 等
3. **实现邮箱密码登录**：添加 Credentials Provider
4. **添加权限控制**：基于用户角色限制访问

---

## 参考资源

- [NextAuth.js 文档](https://next-auth.js.org/)
- [GitHub OAuth 文档](https://docs.github.com/en/apps/oauth-apps)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)

