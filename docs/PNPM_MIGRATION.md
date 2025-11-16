# 迁移到 pnpm 指南

## ✅ 已完成

项目已成功迁移到 pnpm！

## 变更内容

### 1. 更新了文档
- ✅ README.md - 所有命令改为 pnpm
- ✅ QUICK_START.md - 所有命令改为 pnpm
- ✅ ENV_SETUP.md - 所有命令改为 pnpm
- ✅ DEVELOPMENT_STATUS.md - 所有命令改为 pnpm

### 2. 更新了配置文件
- ✅ .gitignore - 添加了 pnpm-debug.log*
- ✅ .npmrc - 创建了 pnpm 配置文件

## 使用 pnpm 的优势

1. **更快的安装速度** - 使用硬链接和符号链接，安装速度比 npm 快 2-3 倍
2. **更节省磁盘空间** - 所有项目共享同一个全局存储
3. **更严格的依赖管理** - 默认使用严格的对等依赖解析
4. **更好的 monorepo 支持** - 原生支持 workspace

## 常用命令对比

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm run build` | `pnpm build` |
| `npm run db:generate` | `pnpm db:generate` |
| `npm run db:push` | `pnpm db:push` |
| `npx <command>` | `pnpm dlx <command>` |

## 下一步操作

### 1. 安装 pnpm（如果还没有）

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 Homebrew (macOS)
brew install pnpm

# 或使用 curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 2. 删除旧的依赖（如果存在）

```bash
# 删除 node_modules 和锁文件
rm -rf node_modules
rm -f package-lock.json yarn.lock
```

### 3. 安装依赖

```bash
pnpm install
```

这会自动生成 `pnpm-lock.yaml` 文件。

### 4. 验证安装

```bash
# 检查 pnpm 版本
pnpm --version

# 查看已安装的包
pnpm list
```

## 注意事项

1. **不要提交 pnpm-lock.yaml** - 已经在 .gitignore 中（但建议提交，以便团队协作）
2. **CI/CD 配置** - 如果使用 CI/CD，需要确保安装了 pnpm
3. **Vercel 部署** - Vercel 自动支持 pnpm，无需额外配置

## 故障排除

### 问题：pnpm 命令未找到
**解决**：确保已全局安装 pnpm，或使用 `npx pnpm` 运行

### 问题：依赖安装失败
**解决**：
```bash
# 清除缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install
```

### 问题：对等依赖警告
**解决**：已在 .npmrc 中配置 `strict-peer-dependencies=false`

## 参考

- [pnpm 官方文档](https://pnpm.io/)
- [从 npm 迁移到 pnpm](https://pnpm.io/migration)

