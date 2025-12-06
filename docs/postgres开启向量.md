# postgres向量索引配置

## 以docker容器运行postgres为例

```sh
# 查看容器、进入容器，以postgres:14为例
docker ps
docker exec -it postgres sh

# 安装
apt-get update
apt-get install -y postgresql-14-pgvector

# 连接数据库
psql -U postgres -d knowledge_blog

# 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

# 执行sql
-- 添加向量列
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS "Note_embedding_idx" 
ON "Note" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

# 验证sql
-- 检查扩展是否启用
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 检查列是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Note' AND column_name = 'embedding';
```

## 本地执行

```sh
# 生成 Prisma Client
pnpm db:generate

# 如果使用 Ollama，先下载嵌入模型
ollama pull nomic-embed-text

# 运行批量向量化脚本
pnpm tsx scripts/generate-embeddings.ts
```