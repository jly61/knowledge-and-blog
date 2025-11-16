# 快速设置 GitHub 和 Google 登录

## 当前状态

✅ **已配置：**
- NextAuth.js 已配置 GitHub 和 Google providers
- 登录页面已包含 OAuth 按钮
- 数据库适配器已配置

⏳ **需要完成：**
- 创建 OAuth 应用
- 配置环境变量

---

## 快速步骤

### 1. 创建 GitHub OAuth App（5分钟）

1. 访问：https://github.com/settings/developers
2. 点击 "OAuth Apps" → "New OAuth App"
3. 填写：
   ```
   Application name: Knowledge Blog
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```
4. 点击 "Register application"
5. 点击 "Generate a new client secret"
6. **复制 Client ID 和 Client Secret**

### 2. 创建 Google OAuth App（10分钟）

1. 访问：https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 导航到 "APIs & Services" → "Credentials"
4. 点击 "Create Credentials" → "OAuth client ID"
5. 如果是第一次，先配置 OAuth consent screen：
   - 选择 "External"
   - 填写应用信息
   - 保存并继续
6. 创建 OAuth Client ID：
   ```
   Application type: Web application
   Name: Knowledge Blog
   Authorized JavaScript origins: http://localhost:3000
   Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
   ```
7. **复制 Client ID 和 Client Secret**

### 3. 配置环境变量

编辑 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/knowledge_blog?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="Ga4zqiHo7LUjhR2Vf/vIYKmZa6IT2aCKNT57T0JODUs="

# GitHub OAuth（替换为你的实际值）
GITHUB_CLIENT_ID="你的GitHub_Client_ID"
GITHUB_CLIENT_SECRET="你的GitHub_Client_Secret"

# Google OAuth（替换为你的实际值）
GOOGLE_CLIENT_ID="你的Google_Client_ID"
GOOGLE_CLIENT_SECRET="你的Google_Client_Secret"
```

**同时更新 `.env` 文件：**
```bash
cp .env.local .env
```

### 4. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
pnpm dev
```

### 5. 测试登录

1. 访问：http://localhost:3000/login
2. 点击 "使用 GitHub 登录" 或 "使用 Google 登录"
3. 授权后应该会重定向到 `/dashboard`

---

## 工作原理

### 登录流程

```
1. 用户点击 "使用 GitHub 登录"
   ↓
2. 重定向到 GitHub 授权页面
   ↓
3. 用户授权
   ↓
4. GitHub 重定向回 /api/auth/callback/github
   ↓
5. NextAuth 处理回调，创建/更新用户
   ↓
6. 创建会话，重定向到 /dashboard
```

### 数据库变化

登录成功后，数据库会：

1. **User 表**：创建新用户（如果不存在）
   ```sql
   INSERT INTO "User" (id, email, name, image, ...)
   ```

2. **Account 表**：创建 OAuth 账号关联
   ```sql
   INSERT INTO "Account" (userId, provider, providerAccountId, ...)
   ```

3. **Session 表**：创建会话记录
   ```sql
   INSERT INTO "Session" (sessionToken, userId, expires)
   ```

---

## 验证配置

### 检查环境变量

```bash
# 检查环境变量是否已设置
cat .env.local | grep -E "GITHUB|GOOGLE"
```

### 检查 NextAuth 配置

```typescript
// lib/auth.ts 中应该包含：
providers: [
  GitHubProvider({ ... }),
  GoogleProvider({ ... }),
]
```

### 检查登录页面

访问 http://localhost:3000/login，应该能看到两个登录按钮。

---

## 常见问题

### Q: 点击登录按钮没有反应？

**A:** 检查：
1. 环境变量是否正确配置
2. 开发服务器是否重启
3. 浏览器控制台是否有错误

### Q: 显示 "OAuthAccountNotLinked" 错误？

**A:** 在 `lib/auth.ts` 中添加（仅开发环境）：
```typescript
allowDangerousEmailAccountLinking: true,
```

### Q: 重定向 URL 不匹配？

**A:** 确保 OAuth 应用中的回调 URL 完全匹配：
- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

---

## 生产环境配置

部署到生产环境时：

1. **更新 OAuth 应用设置**：
   - Homepage URL: `https://yourdomain.com`
   - Callback URL: `https://yourdomain.com/api/auth/callback/github`

2. **更新环境变量**：
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   ```

3. **在 Vercel 等平台配置环境变量**

---

## 完成！

配置完成后，用户就可以使用 GitHub 或 Google 账号登录了！

更详细的说明请查看 `OAUTH_SETUP_GUIDE.md`。

