# AI 功能开发规划

## 📋 概述

本文档规划了知识库+博客系统的 AI 功能开发计划，旨在通过 AI 技术提升内容创作、知识管理和用户体验。

## 🎯 功能列表

### 核心功能（必做）

1. **v1.0：对话侧边栏** - 基础 AI 对话功能
2. **v2.0：知识库问答（RAG）** - 基于笔记内容的智能问答
3. **v4.0：思维导图生成** - 自动生成笔记的思维导图

### 增强功能（推荐）

4. **AI 自动生成摘要和 SEO** - 发布文章时自动优化
5. **AI 自动标签推荐** - 根据内容推荐标签和分类
6. **AI 双向链接建议** - 智能推荐可链接的笔记

### 可选功能

7. **v3.0：编辑器副驾驶** - 编辑器内 AI 辅助写作（实现复杂，后期考虑）

---

## 📅 开发阶段规划

### 第一阶段：基础对话功能（1-2 天）

**目标**：实现基础的 AI 对话能力

#### 功能 1：v1.0 对话侧边栏

**功能描述**：
- 在笔记页面右侧添加可折叠的聊天侧边栏
- 支持与 AI 进行基础对话
- 流式响应，打字机效果
- Markdown 渲染支持（代码块、表格等）

**技术实现**：
- 使用 Vercel AI SDK (`ai` 包)
- 集成 OpenAI API 或 Ollama（本地模型）
- 流式响应处理
- React Markdown 渲染

**文件结构**：
```
components/
  ai/
    ├── chat-sidebar.tsx          # 侧边栏组件
    ├── chat-message.tsx           # 消息组件
    └── streaming-text.tsx         # 流式文本显示

app/
  api/
    ai/
      └── chat/
        └── route.ts              # 聊天 API 路由

lib/
  ai/
    ├── client.ts                 # AI 客户端配置
    └── prompts.ts                # Prompt 模板
```

**实现步骤**：
1. 安装依赖：`pnpm add ai @ai-sdk/openai` 或 `pnpm add ollama`
2. 创建 API 路由处理聊天请求
3. 实现侧边栏组件（可折叠、响应式）
4. 集成流式响应和 Markdown 渲染
5. 添加错误处理和加载状态

**验收标准**：
- ✅ 侧边栏可以打开/关闭
- ✅ 可以发送消息并收到 AI 回复
- ✅ 回复以流式方式显示（打字机效果）
- ✅ Markdown 内容正确渲染（代码块、表格等）

---

### 第二阶段：知识库问答 RAG（2-3 天）

**目标**：让 AI 能够理解并回答关于笔记内容的问题

#### 功能 2：v2.0 知识库问答（RAG）

**功能描述**：
- AI 可以读取当前笔记的内容
- 回答关于笔记的问题
- 支持跨笔记问答（基于向量相似度检索）

**技术实现**：
- 向量数据库：pgvector（PostgreSQL 扩展）或 Pinecone
- 嵌入模型：OpenAI `text-embedding-3-small` 或本地模型（nomic-embed）
- RAG 流程：查询 → 向量检索 → 上下文注入 → LLM 生成

**文件结构**：
```
lib/
  ai/
    ├── embeddings.ts             # 向量嵌入
    ├── rag.ts                    # RAG 检索逻辑
    └── vector-store.ts           # 向量存储操作

app/
  api/
    ai/
      ├── embeddings/
        └── route.ts              # 向量化 API
      └── rag/
        └── route.ts              # RAG 查询 API

prisma/
  migrations/
    └── add_vector_extension.sql  # pgvector 扩展
```

**数据库变更**：
```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为 Note 表添加向量列
ALTER TABLE "Note" ADD COLUMN "embedding" vector(1536);
CREATE INDEX ON "Note" USING ivfflat (embedding vector_cosine_ops);
```

**实现步骤**：
1. 配置 pgvector 或 Pinecone
2. 实现笔记向量化功能（保存笔记时自动向量化）
3. 实现向量检索功能（相似度搜索）
4. 修改聊天 API，注入笔记上下文
5. 实现批量向量化（为现有笔记生成向量）

**验收标准**：
- ✅ 新建/更新笔记时自动生成向量
- ✅ 可以询问笔记相关问题并得到准确回答
- ✅ 支持跨笔记问答（检索相关笔记）
- ✅ 回答包含引用来源（显示引用的笔记）

---

### 第三阶段：内容增强功能（2-3 天）

**目标**：提升内容创作效率和质量

#### 功能 3：AI 自动生成摘要和 SEO

**功能描述**：
- 发布文章时自动生成摘要
- 自动生成 SEO 标题和描述
- 优化现有文章的 SEO 元数据

**技术实现**：
- 在发布流程中调用 AI
- 使用结构化输出确保格式正确
- 缓存结果避免重复调用

**文件结构**：
```
app/
  actions/
    ai/
      └── seo.ts                  # SEO 生成 Server Action

components/
  posts/
    └── ai-seo-generator.tsx      # SEO 生成组件
```

**实现步骤**：
1. 创建 SEO 生成 Server Action
2. 在发布表单中添加"AI 生成"按钮
3. 集成到发布流程（可选自动生成）
4. 添加手动触发功能（优化现有文章）

**验收标准**：
- ✅ 点击"AI 生成"按钮可以自动填充摘要和 SEO 信息
- ✅ 生成的内容质量良好，符合 SEO 规范
- ✅ 可以手动编辑生成的内容

---

#### 功能 4：AI 自动标签推荐

**功能描述**：
- 根据笔记/文章内容自动推荐标签
- 推荐合适的分类
- 显示推荐理由

**技术实现**：
- 分析内容提取关键词
- 匹配现有标签和分类
- 使用 LLM 进行智能推荐

**文件结构**：
```
app/
  actions/
    ai/
      └── tags.ts                 # 标签推荐 Server Action

components/
  notes/
    └── ai-tag-suggestions.tsx    # 标签推荐组件
```

**实现步骤**：
1. 创建标签推荐 Server Action
2. 在笔记编辑器添加推荐面板
3. 实现一键应用推荐标签
4. 显示推荐置信度

**验收标准**：
- ✅ 编辑笔记时可以查看 AI 推荐的标签
- ✅ 推荐的标签准确且相关
- ✅ 可以一键应用推荐的标签

---

#### 功能 5：AI 双向链接建议

**功能描述**：
- 检测笔记中可能存在的链接机会
- 提示"你可能想链接到：XX 笔记"
- 一键插入双向链接

**技术实现**：
- 使用向量相似度查找相关笔记
- 分析上下文判断链接必要性
- 在编辑器中显示建议

**文件结构**：
```
components/
  editor/
    └── ai-link-suggestions.tsx   # 链接建议组件

lib/
  ai/
    └── link-suggestions.ts       # 链接建议逻辑
```

**实现步骤**：
1. 实现链接建议算法（基于向量相似度）
2. 在编辑器中检测光标位置
3. 显示建议的链接（悬浮提示）
4. 实现一键插入链接功能

**验收标准**：
- ✅ 编辑笔记时显示链接建议
- ✅ 建议的笔记相关且准确
- ✅ 可以一键插入 `[[笔记标题]]` 格式的链接

---

### 第四阶段：可视化增强（1-2 天）

**目标**：通过 AI 增强知识图谱功能

#### 功能 6：v4.0 思维导图生成

**功能描述**：
- 对 AI 说："把这篇笔记画成思维导图"
- AI 返回结构化的思维导图数据
- 渲染为可交互的思维导图

**技术实现**：
- 使用 OpenAI Structured Outputs 或 JSON Mode
- 定义思维导图 JSON Schema
- 使用 React Flow 或 vis-network 渲染

**文件结构**：
```
components/
  ai/
    └── mindmap-viewer.tsx        # 思维导图组件

lib/
  ai/
    └── mindmap.ts                # 思维导图生成逻辑

types/
  └── mindmap.ts                  # 思维导图类型定义
```

**思维导图 Schema**：
```typescript
interface MindMapNode {
  id: string
  label: string
  level: number
  children: string[]
}

interface MindMapData {
  nodes: MindMapNode[]
  edges: Array<{ from: string; to: string }>
}
```

**实现步骤**：
1. 定义思维导图数据结构
2. 创建思维导图生成 API（使用结构化输出）
3. 实现思维导图渲染组件
4. 集成到对话侧边栏（特殊命令触发）

**验收标准**：
- ✅ 可以请求生成思维导图
- ✅ 生成的思维导图结构合理
- ✅ 思维导图可以交互（拖拽、缩放）
- ✅ 可以导出思维导图

---

### 第五阶段：编辑器增强（可选，3-5 天）

**目标**：在编辑器中直接使用 AI 辅助

#### 功能 7：v3.0 编辑器副驾驶

**功能描述**：
- 选中文字后显示悬浮菜单（润色/扩写/缩写）
- 按 Tab 键自动补全后续内容（简化版）
- 侧边栏显示 AI 建议（最简单版）

**技术实现**：
- 方案 A（简单）：悬浮菜单 + 侧边栏建议
- 方案 B（复杂）：Ghost Text + Tab 补全

**文件结构**：
```
components/
  editor/
    ├── ai-floating-menu.tsx      # 悬浮菜单
    ├── ai-suggestion-panel.tsx   # 建议面板
    └── ai-ghost-text.tsx         # Ghost Text（复杂版）

lib/
  ai/
    └── editor-assistant.ts       # 编辑器助手逻辑
```

**实现步骤（简化版）**：
1. 实现文字选中检测
2. 显示悬浮菜单（润色/扩写/缩写）
3. 调用 AI 并替换选中内容
4. 添加侧边栏显示建议（可选）

**验收标准**：
- ✅ 选中文字后可以触发 AI 操作
- ✅ 润色/扩写功能正常工作
- ✅ 替换内容流畅无闪烁

---

## 🛠️ 技术栈

### AI 服务

**推荐方案（免费/低成本）**：
- **本地模型**：Ollama + Llama 3.1 8B（完全免费）
- **嵌入模型**：Ollama + nomic-embed（免费）
- **向量数据库**：pgvector（PostgreSQL 扩展，免费）

**备选方案（付费但更强）**：
- **LLM**：OpenAI GPT-3.5-turbo / GPT-4o-mini
- **嵌入**：OpenAI text-embedding-3-small
- **向量数据库**：Pinecone（有免费层）

### 前端库

- **AI SDK**：`ai` (Vercel AI SDK)
- **Markdown 渲染**：`react-markdown`（已安装）
- **流式响应**：`useChat` hook
- **可视化**：`reactflow` 或 `vis-network`（已有）

### 后端

- **API 路由**：Next.js App Router API Routes
- **Server Actions**：Next.js Server Actions
- **数据库**：PostgreSQL + Prisma
- **向量扩展**：pgvector

---

## 📦 依赖安装

### 基础依赖

```bash
# AI SDK
pnpm add ai

# OpenAI（如果使用）
pnpm add @ai-sdk/openai

# 或 Ollama（如果使用本地模型）
pnpm add ollama

# 向量数据库客户端（如果使用 Pinecone）
pnpm add @pinecone-database/pinecone

# 思维导图（如果使用 React Flow）
pnpm add reactflow
```

### 开发依赖

```bash
# 类型定义
pnpm add -D @types/node
```

---

## 🔧 环境变量配置

在 `.env.local` 中添加：

```env
# OpenAI（如果使用）
OPENAI_API_KEY=sk-...

# 或 Ollama（本地模型，无需 API Key）
OLLAMA_BASE_URL=http://localhost:11434

# Pinecone（如果使用）
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
```

---

## 📊 时间估算

| 阶段 | 功能 | 时间 | 优先级 |
|------|------|------|--------|
| 第一阶段 | v1.0 对话侧边栏 | 1-2 天 | ⭐⭐⭐⭐⭐ |
| 第二阶段 | v2.0 知识库问答 | 2-3 天 | ⭐⭐⭐⭐⭐ |
| 第三阶段 | AI 摘要和 SEO | 1 天 | ⭐⭐⭐⭐ |
| 第三阶段 | AI 标签推荐 | 1 天 | ⭐⭐⭐⭐ |
| 第三阶段 | AI 链接建议 | 1 天 | ⭐⭐⭐⭐ |
| 第四阶段 | v4.0 思维导图 | 1-2 天 | ⭐⭐⭐ |
| 第五阶段 | v3.0 编辑器副驾驶 | 3-5 天 | ⭐⭐ |

**总计**：约 10-16 天（按优先级分阶段实施）

---

## 🎯 实施建议

### 快速启动（MVP）

**第一周**：
1. v1.0 对话侧边栏（2 天）
2. v2.0 知识库问答基础版（3 天）

**第二周**：
3. AI 摘要和 SEO（1 天）
4. AI 标签推荐（1 天）
5. AI 链接建议（1 天）

**第三周**：
6. v4.0 思维导图（2 天）
7. 优化和测试（2 天）

### 完整版

在 MVP 基础上，根据需求添加：
- v3.0 编辑器副驾驶（可选）

---

## ✅ 验收清单

### 第一阶段验收
- [ ] 对话侧边栏可以正常使用
- [ ] 流式响应正常工作
- [ ] Markdown 渲染正确

### 第二阶段验收
- [ ] 笔记向量化功能正常
- [ ] 可以回答笔记相关问题
- [ ] 支持跨笔记问答

### 第三阶段验收
- [ ] AI 生成摘要和 SEO 功能正常
- [ ] 标签推荐准确
- [ ] 链接建议有用

### 第四阶段验收
- [ ] 思维导图生成功能正常
- [ ] 思维导图可以交互

### 第五阶段验收（可选）
- [ ] 编辑器悬浮菜单正常
- [ ] AI 辅助功能流畅

---

## 📝 注意事项

1. **成本控制**：
   - 优先使用本地模型（Ollama）降低成本
   - 实现结果缓存避免重复调用
   - 限制调用频率

2. **性能优化**：
   - 向量化可以异步处理
   - 使用 Server Actions 减少 API 调用
   - 实现合理的缓存策略

3. **用户体验**：
   - 所有 AI 功能都应该有加载状态
   - 提供错误处理和重试机制
   - 允许用户手动编辑 AI 生成的内容

4. **隐私安全**：
   - 敏感内容考虑使用本地模型
   - 不要将敏感信息发送到第三方 API
   - 实现合理的权限控制

---

## 🔗 相关文档

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Ollama 文档](https://ollama.ai/docs)
- [pgvector 文档](https://github.com/pgvector/pgvector)
- [React Flow 文档](https://reactflow.dev/)

---

## 📅 更新日志

- 2024-12-XX：初始版本，规划所有 AI 功能

