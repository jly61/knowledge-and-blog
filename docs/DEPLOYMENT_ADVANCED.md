# 高级部署配置指南

## 📋 概述

本文档说明项目的高级部署配置功能，包括环境变量管理、CI/CD 自动化、多环境配置和部署回滚。

## 🎯 功能清单

- ✅ 环境变量验证和管理
- ✅ CI/CD 自动化构建和部署
- ✅ 多环境配置支持
- ✅ 部署回滚机制

---

## 1. 环境变量管理

### 1.1 环境变量模板

项目提供了 `.env.example` 作为环境变量模板：

```bash
# 复制模板
cp .env.example .env.local

# 编辑并填写实际值
# ...
```

### 1.2 环境变量验证

使用验证脚本检查环境变量配置：

```bash
# 验证当前环境
pnpm validate-env

# 验证生产环境配置
pnpm validate-env --env=production
```

**验证内容**：
- ✅ 检查必需变量是否存在
- ✅ 验证变量格式是否正确
- ✅ 检查 OAuth 配置的完整性
- ✅ 验证 URL 格式

### 1.3 环境变量文档

详细说明请参考：[环境变量配置指南](./DEPLOYMENT_ENV.md)

---

## 2. CI/CD 自动化

### 2.1 GitHub Actions 工作流

项目包含两个 GitHub Actions 工作流：

#### CI 工作流（`.github/workflows/ci.yml`）

**触发时机**：
- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request

**执行步骤**：
1. 代码检查（ESLint）
2. 类型检查（TypeScript）
3. 环境变量验证
4. 构建应用

#### 预览部署工作流（`.github/workflows/deploy-preview.yml`）

**触发时机**：
- 创建 Pull Request

**执行步骤**：
- 自动部署到 Vercel 预览环境

### 2.2 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 说明 |
|------------|------|
| `DATABASE_URL` | 数据库连接字符串 |
| `NEXTAUTH_URL` | 应用 URL |
| `NEXTAUTH_SECRET` | NextAuth 密钥 |
| `VERCEL_TOKEN` | Vercel API Token |
| `VERCEL_ORG_ID` | Vercel 组织 ID |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID |

**获取方式**：
- Vercel Token: [Vercel Settings → Tokens](https://vercel.com/account/tokens)
- Vercel IDs: 项目设置页面 URL 中获取

### 2.3 Vercel 自动部署

Vercel 会自动检测 Git 推送并部署：

- **Production**：推送到 `main` 分支
- **Preview**：推送到其他分支或 PR

---

## 3. 多环境配置

### 3.1 环境类型

项目支持三种环境：

- **development** - 本地开发
- **preview** - 预览环境（Vercel Preview）
- **production** - 生产环境

### 3.2 环境配置管理

使用 `lib/config.ts` 统一管理环境配置：

```typescript
import { config } from '@/lib/config'

// 使用配置
if (config.isProduction) {
  // 生产环境特定逻辑
}

// 访问配置
const dbUrl = config.database.url
const appUrl = config.app.url
```

### 3.3 环境切换

使用环境切换脚本：

```bash
# 切换到开发环境
pnpm switch-env development

# 切换到预览环境
pnpm switch-env preview

# 切换到生产环境
pnpm switch-env production
```

---

## 4. 部署回滚

### 4.1 Vercel 回滚

**方式 1：使用 Dashboard（推荐）**

1. 访问 Vercel Dashboard
2. 进入项目 → Deployments
3. 找到要回滚的版本
4. 点击 "Promote to Production"

**方式 2：使用 CLI**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 回滚到上一个版本
vercel rollback previous

# 回滚到指定版本
vercel rollback <deployment-url>
```

**方式 3：使用脚本**

```bash
# 使用项目提供的回滚脚本
./scripts/rollback.sh previous
```

### 4.2 数据库迁移回滚

如果回滚涉及数据库变更：

```bash
# 查看迁移状态
pnpm prisma migrate status

# 回滚迁移（需要手动执行反向 SQL）
# 或使用 Prisma Migrate 的 resolve 命令
```

### 4.3 回滚检查清单

- [ ] 确认需要回滚的问题
- [ ] 备份当前数据
- [ ] 选择稳定版本
- [ ] 执行回滚操作
- [ ] 验证功能正常

详细说明请参考：[部署回滚指南](./DEPLOYMENT_ROLLBACK.md)

---

## 🚀 快速开始

### 1. 配置环境变量

```bash
# 1. 复制模板
cp .env.example .env.local

# 2. 编辑 .env.local
# 3. 验证配置
pnpm validate-env
```

### 2. 配置 CI/CD

1. 在 GitHub 仓库设置中添加 Secrets
2. 推送代码触发 CI
3. 创建 PR 触发预览部署

### 3. 生产环境部署

1. 在 Vercel 配置环境变量
2. 推送到 `main` 分支
3. Vercel 自动部署

---

## 📚 相关文档

- [环境变量配置指南](./DEPLOYMENT_ENV.md)
- [部署回滚指南](./DEPLOYMENT_ROLLBACK.md)
- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [快速部署指南](./DEPLOYMENT_QUICK_START.md)

---

## 💡 最佳实践

1. **环境变量管理**
   - 使用 `.env.example` 作为模板
   - 定期验证环境变量
   - 不同环境使用不同的密钥

2. **CI/CD**
   - 每次提交都运行 CI
   - PR 自动部署预览环境
   - 主分支自动部署生产环境

3. **多环境**
   - 使用 `lib/config.ts` 统一管理
   - 避免在代码中直接使用 `process.env`
   - 环境特定配置使用环境变量

4. **回滚**
   - 保留部署历史
   - 标记稳定版本
   - 定期演练回滚流程

