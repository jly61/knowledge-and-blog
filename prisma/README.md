# Prisma 数据库脚本

## 文件说明

- `schema.prisma` - Prisma 数据库模式定义文件
- `fix-empty-slugs.sql` - 修复空 slug 的 SQL 脚本
- `fix-empty-slugs.ts` - 修复空 slug 的 TypeScript 脚本（推荐）

## 数据库迁移

### 使用 Prisma Migrate（推荐用于生产环境）

```bash
# 创建迁移
pnpm db:migrate

# 迁移文件会保存在 prisma/migrations/ 目录下
```

### 使用 Prisma Push（开发环境）

```bash
# 直接推送 schema 到数据库（不创建迁移文件）
pnpm db:push
```

## 修复空 slug 文章

### 方法 1：使用 TypeScript 脚本（推荐）

```bash
# 安装 tsx（如果还没有）
pnpm add -D tsx

# 运行修复脚本
npx tsx prisma/fix-empty-slugs.ts
```

### 方法 2：使用 SQL 脚本

1. 打开 Prisma Studio：
   ```bash
   pnpm db:studio
   ```

2. 在 Prisma Studio 中执行 `fix-empty-slugs.sql` 中的 SQL 语句

3. 或直接在数据库中执行：
   ```bash
   psql -d your_database -f prisma/fix-empty-slugs.sql
   ```

### 方法 3：手动修复

在 Prisma Studio 中：
1. 打开 Post 表
2. 找到 slug 为空的文章
3. 手动编辑 slug 字段

## 常用命令

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送 schema 到数据库
pnpm db:push

# 创建并应用迁移
pnpm db:migrate

# 打开 Prisma Studio（数据库可视化工具）
pnpm db:studio

# 重置数据库（危险！会删除所有数据）
pnpm prisma migrate reset
```

## 迁移文件位置

如果使用 `pnpm db:migrate`，迁移文件会保存在：
```
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_migration_name/
        └── migration.sql
```

