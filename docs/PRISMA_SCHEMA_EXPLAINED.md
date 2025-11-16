# Prisma Schema 文件详解

## 什么是 Prisma Schema？

Prisma Schema 是数据库的"设计图"，它定义了：
- 有哪些数据表（Model）
- 每个表有哪些字段
- 字段的类型和约束
- 表之间的关系

## 文件结构

### 1. 配置部分（文件开头）

```prisma
generator client {
  provider = "prisma-client-js"
}
```

**作用：** 告诉 Prisma 生成什么类型的客户端代码
- `prisma-client-js` = 生成 JavaScript/TypeScript 客户端
- 这个客户端让你可以用代码操作数据库，而不需要写 SQL

---

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**作用：** 配置数据库连接
- `provider = "postgresql"` = 使用 PostgreSQL 数据库
- `url = env("DATABASE_URL")` = 从环境变量读取数据库连接地址

---

## 2. 数据模型（Model）

每个 `model` 代表数据库中的一个表。

### 示例：User 模型

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
  dailyNotes    DailyNote[]
}
```

**逐行解释：**

1. `model User` = 创建一个名为 "User" 的表（用户表）

2. `id String @id @default(uuid())`
   - `id` = 字段名
   - `String` = 字符串类型
   - `@id` = 这是主键（唯一标识）
   - `@default(uuid())` = 默认值是一个随机 UUID

3. `email String @unique`
   - `email` = 邮箱字段
   - `String` = 字符串类型
   - `@unique` = 这个字段的值必须唯一（不能重复）

4. `name String?`
   - `name` = 名字字段
   - `String?` = 字符串类型，`?` 表示可选（可以为空）

5. `createdAt DateTime @default(now())`
   - `createdAt` = 创建时间
   - `@default(now())` = 默认值是当前时间

6. `updatedAt DateTime @updatedAt`
   - `updatedAt` = 更新时间
   - `@updatedAt` = 每次更新时自动设置为当前时间

7. `accounts Account[]`
   - 这表示关系：一个 User 可以有多个 Account
   - `Account[]` = Account 数组（一对多关系）

---

## 3. 字段类型

### 基本类型

- `String` = 文本
- `Int` = 整数
- `Boolean` = 布尔值（true/false）
- `DateTime` = 日期时间
- `Float` = 浮点数

### 可选字段

- `String?` = 可选的字符串（可以为 null）
- `String` = 必填的字符串（不能为 null）

### 特殊类型

- `@db.Text` = 存储长文本（PostgreSQL 的 TEXT 类型）
- `@db.Date` = 只存储日期（不包含时间）

---

## 4. 字段修饰符（Decorators）

### `@id` - 主键
```prisma
id String @id
```
唯一标识一条记录，每个表必须有一个主键。

### `@unique` - 唯一约束
```prisma
email String @unique
```
这个字段的值不能重复。

### `@default()` - 默认值
```prisma
createdAt DateTime @default(now())
isPrivate Boolean @default(true)
```
创建记录时，如果没有提供值，使用默认值。

### `@updatedAt` - 自动更新时间
```prisma
updatedAt DateTime @updatedAt
```
每次更新记录时，自动设置为当前时间。

---

## 5. 关系（Relations）

### 一对一关系（One-to-One）

```prisma
model Note {
  postId String? @unique
  post   Post?   @relation("NotePost")
}

model Post {
  noteId String? @unique
  note   Note?   @relation("NotePost", fields: [noteId], references: [id])
}
```

**解释：**
- 一个 Note 可以对应一个 Post（可选）
- 一个 Post 可以对应一个 Note（可选）
- `@unique` 确保一对一关系
- `@relation("NotePost")` 给关系命名

**实际意义：** 一篇笔记可以发布为一篇博客文章。

---

### 一对多关系（One-to-Many）

```prisma
model User {
  notes Note[]
}

model Note {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

**解释：**
- 一个 User 可以有多个 Note（`Note[]`）
- 一个 Note 只属于一个 User（`userId`）

**实际意义：** 一个用户可以创建多篇笔记。

---

### 多对多关系（Many-to-Many）

```prisma
model Note {
  tags Tag[]
}

model Tag {
  notes Note[]
}
```

**解释：**
- 一个 Note 可以有多个 Tag
- 一个 Tag 可以关联多个 Note
- Prisma 会自动创建中间表

**实际意义：** 一篇笔记可以有多个标签，一个标签可以用于多篇笔记。

---

## 6. 索引（Indexes）

```prisma
@@index([userId])
@@index([categoryId])
@@index([isPinned, updatedAt])
```

**作用：** 提高查询速度

**解释：**
- `@@index([userId])` = 在 `userId` 字段上创建索引
- `@@index([isPinned, updatedAt])` = 在多个字段上创建复合索引

**为什么需要索引？**
- 没有索引：查询需要扫描整个表（慢）
- 有索引：直接定位到数据（快）

---

## 7. 约束（Constraints）

### `@@unique` - 唯一约束
```prisma
@@unique([userId, date])
```
多个字段的组合必须唯一。

**实际例子：** 一个用户在同一天只能有一篇每日笔记。

---

## 8. 级联操作（Cascade）

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**解释：**
- `onDelete: Cascade` = 当 User 被删除时，相关的 Note 也会被删除
- `onDelete: SetNull` = 当关联记录被删除时，这个字段设置为 null

**实际意义：** 删除用户时，自动删除他的所有笔记。

---

## 9. 实际应用示例

### 创建一条记录

```typescript
// 使用 Prisma Client
const user = await db.user.create({
  data: {
    email: "user@example.com",
    name: "张三"
  }
})
// createdAt 和 id 会自动生成
```

### 查询记录

```typescript
// 查询所有笔记
const notes = await db.note.findMany({
  where: { userId: user.id }
})

// 查询并包含关联数据
const note = await db.note.findUnique({
  where: { id: "note-id" },
  include: {
    user: true,      // 包含用户信息
    tags: true,      // 包含标签
    category: true   // 包含分类
  }
})
```

### 更新记录

```typescript
await db.note.update({
  where: { id: "note-id" },
  data: {
    title: "新标题",
    isPinned: true
  }
})
// updatedAt 会自动更新
```

---

## 10. 本项目的模型关系图

```
User (用户)
  ├── Account[] (OAuth 账号)
  ├── Session[] (登录会话)
  ├── Note[] (笔记)
  ├── Post[] (文章)
  ├── Comment[] (评论)
  └── DailyNote[] (每日笔记)

Note (笔记)
  ├── User (所属用户)
  ├── Category? (分类，可选)
  ├── Tag[] (标签，多对多)
  ├── Post? (关联的文章，一对一)
  ├── NoteLink[] (链接到的笔记)
  ├── NoteLink[] (被链接的笔记，反向)
  └── NoteVersion[] (版本历史)

Post (文章)
  ├── User (作者)
  ├── Note? (来源笔记)
  ├── Category? (分类)
  ├── Tag[] (标签)
  └── Comment[] (评论)

NoteLink (笔记链接关系)
  ├── fromNote (来源笔记)
  └── toNote (目标笔记)
```

---

## 11. 常见问题

### Q: 为什么有些字段有 `?`，有些没有？

**A:** 
- `String?` = 可选字段（可以为 null）
- `String` = 必填字段（不能为 null）

### Q: `@id` 和 `@unique` 有什么区别？

**A:**
- `@id` = 主键，每个表必须有一个，用于唯一标识记录
- `@unique` = 唯一约束，可以有多个，只是确保值不重复

### Q: 关系中的 `fields` 和 `references` 是什么？

**A:**
- `fields` = 当前表中的外键字段
- `references` = 关联表中的主键字段

例如：
```prisma
user User @relation(fields: [userId], references: [id])
```
意思是：`userId` 字段的值对应 `User` 表的 `id` 字段。

### Q: 什么时候用 `[]`，什么时候不用？

**A:**
- `Note[]` = 一对多关系（一个 User 有多个 Note）
- `Note?` = 一对一关系（一个 Note 对应一个 Post，可选）
- `Note` = 一对一关系（必填）

---

## 12. 修改 Schema 后的操作

1. **修改 schema.prisma 文件**

2. **生成 Prisma Client**
   ```bash
   pnpm db:generate
   ```

3. **同步到数据库**
   ```bash
   pnpm db:push  # 开发环境
   # 或
   pnpm db:migrate  # 生产环境（会创建迁移文件）
   ```

---

## 总结

Prisma Schema 就像建筑图纸：
- **Model** = 房间（表）
- **字段** = 房间里的物品（列）
- **关系** = 房间之间的门（外键）
- **索引** = 快速通道（提高查询速度）
- **约束** = 规则（唯一性、必填等）

通过这个文件，Prisma 可以：
1. 自动生成类型安全的客户端代码
2. 自动创建数据库表结构
3. 提供类型提示和验证
4. 简化数据库操作

