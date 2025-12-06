# RAG 功能设置指南

## 📋 概述

RAG (Retrieval Augmented Generation) 功能让 AI 能够基于你的笔记内容回答问题。本文档介绍如何设置和使用 RAG 功能。

## 🛠️ 前置要求

### 1. 数据库扩展：pgvector

RAG 功能需要 PostgreSQL 的 `pgvector` 扩展来存储和搜索向量。

#### 本地开发环境

如果你使用本地 PostgreSQL：

```bash
# 安装 pgvector 扩展
# macOS (使用 Homebrew)
brew install pgvector

# 或使用 Docker
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=yourdb \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# 连接到数据库并启用扩展
psql -U postgres -d yourdb
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Vercel Postgres

如果使用 Vercel Postgres，需要在 Vercel 控制台执行 SQL：

1. 打开 Vercel Dashboard
2. 选择你的项目
3. 进入 Storage → Postgres
4. 点击 "Query" 标签
5. 执行以下 SQL：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. 运行数据库迁移

执行迁移脚本以添加向量列：

```bash
# 方法 1：直接执行 SQL（推荐）
psql $DATABASE_URL -f prisma/migrations/add_pgvector_extension.sql

# 方法 2：在数据库客户端中执行
# 打开 prisma/migrations/add_pgvector_extension.sql 文件
# 复制内容到数据库客户端执行
```

### 3. 更新 Prisma Schema

Schema 已经更新，运行：

```bash
pnpm db:generate
```

## 🚀 使用 RAG 功能

### 1. 自动向量化

新建或更新笔记时，系统会自动生成向量嵌入：

- ✅ 创建笔记时自动向量化
- ✅ 更新笔记内容时自动重新向量化
- ⚠️ 向量化是异步的，不会阻塞笔记保存

### 2. 批量向量化现有笔记

为所有现有笔记生成向量：

```bash
pnpm tsx scripts/generate-embeddings.ts
```

脚本会：
- 查找所有没有向量的笔记
- 逐个生成向量嵌入
- 保存到数据库

**注意**：
- 如果使用 OpenAI，会产生 API 调用费用
- 如果使用 Ollama，需要先下载嵌入模型：`ollama pull nomic-embed-text`

### 3. 在笔记详情页使用 RAG

1. 打开任意笔记详情页：`/notes/[id]`
2. 点击右下角的 AI 助手按钮
3. 在聊天中输入问题
4. AI 会自动：
   - 读取当前笔记内容
   - 检索相关笔记
   - 基于笔记内容回答问题

## 🔧 配置

### OpenAI（推荐，更准确）

在 `.env.local` 中配置：

```env
OPENAI_API_KEY=sk-...
```

使用 `text-embedding-3-small` 模型（1536 维）

### Ollama（免费，本地运行）

1. 安装 Ollama：参考 [Ollama 设置指南](./OLLAMA_SETUP.md)

2. 下载嵌入模型：

```bash
# 推荐模型
ollama pull nomic-embed-text

# 或使用其他模型
ollama pull nomic-embed
ollama pull all-minilm
```

3. 配置环境变量（可选）：

```env
OLLAMA_BASE_URL=http://localhost:11434
```

**注意**：Ollama 的嵌入模型维度可能与 OpenAI 不同，系统会自动调整。

## 📊 工作原理

### RAG 流程

```
用户问题
  ↓
生成查询向量
  ↓
向量相似度搜索（pgvector）
  ↓
检索相关笔记（Top 5）
  ↓
构建上下文提示
  ↓
注入到 AI 系统提示
  ↓
AI 基于笔记内容回答
```

### 向量搜索

- **相似度算法**：余弦相似度
- **相似度阈值**：0.7（可调整）
- **返回数量**：最多 5 条相关笔记
- **索引类型**：ivfflat（适合大规模数据）

## 🐛 故障排除

### 问题 1：向量搜索失败

**错误**：`operator does not exist: vector`

**解决**：
1. 确保已启用 pgvector 扩展：`CREATE EXTENSION IF NOT EXISTS vector;`
2. 检查数据库连接是否正常

### 问题 2：向量维度不匹配

**错误**：`vector dimensions do not match`

**解决**：
- OpenAI：使用 1536 维（text-embedding-3-small）
- Ollama：系统会自动调整维度

### 问题 3：向量生成失败

**错误**：`Failed to generate embedding`

**解决**：
- 检查 API Key 是否正确（OpenAI）
- 检查 Ollama 是否运行（本地模型）
- 检查网络连接

### 问题 4：检索结果不准确

**解决**：
- 调整相似度阈值（在 `lib/ai/rag.ts` 中）
- 增加返回数量（limit 参数）
- 确保笔记内容质量良好

## 📈 性能优化

### 1. 向量索引优化

根据数据量调整索引参数：

```sql
-- 重建索引（适合数据量变化后）
DROP INDEX IF EXISTS "Note_embedding_idx";
CREATE INDEX "Note_embedding_idx" 
ON "Note" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- 根据数据量调整：数据量 / 1000
```

### 2. 批量向量化优化

如果笔记很多，可以分批处理：

```typescript
// 修改 scripts/generate-embeddings.ts
// 添加分批处理逻辑
const BATCH_SIZE = 10
for (let i = 0; i < notes.length; i += BATCH_SIZE) {
  const batch = notes.slice(i, i + BATCH_SIZE)
  // 处理批次
}
```

## 📚 相关文档

- [AI 功能开发规划](./AI_FEATURES_PLAN.md)
- [AI 功能教学文档](./AI_FEATURES_TUTORIAL.md)
- [Ollama 设置指南](./OLLAMA_SETUP.md)

---

**最后更新**：2024-12-05

