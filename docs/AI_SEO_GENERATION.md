# AI 自动生成摘要和 SEO 功能

## 📋 功能概述

AI 自动生成摘要和 SEO 功能可以帮助用户快速生成文章的 SEO 元数据，包括：
- **SEO 标题**：优化后的标题（50-60 字符，包含关键词）
- **SEO 描述**：用于 meta description（150-160 字符）
- **文章摘要**：用于预览和列表页显示（150-200 字符）
- **SEO 关键词**：3-5 个关键词（可选）

## ✅ 已完成功能

### 1. SEO 生成 Server Action
- ✅ 创建 `app/actions/ai/seo.ts`
- ✅ 支持 OpenAI 和 Ollama 本地模型
- ✅ 智能解析 AI 返回结果（支持 JSON 和 Markdown 格式）
- ✅ 错误处理和重试机制

### 2. 发布表单集成
- ✅ 在 `components/posts/publish-note-client.tsx` 中添加 AI 生成按钮
- ✅ 点击按钮自动填充 SEO 标题和描述
- ✅ 加载状态和错误提示

### 3. 文章编辑器集成
- ✅ 在 `components/posts/post-editor.tsx` 中添加 AI 生成按钮
- ✅ 支持生成摘要、SEO 标题和描述
- ✅ 加载状态和错误提示

### 4. Prompt 模板
- ✅ 创建 SEO 生成提示词模板（`lib/ai/prompts.ts`）
- ✅ 包含详细的生成要求和格式说明

## 🎯 使用方法

### 在发布文章时使用

1. 打开笔记详情页，点击"发布为文章"
2. 在发布表单中，找到"SEO 标题"字段
3. 点击右上角的"AI 生成"按钮（带 ✨ 图标）
4. 等待 AI 生成完成（通常需要 3-10 秒）
5. 生成的 SEO 标题和描述会自动填充到表单中
6. 可以手动编辑生成的内容
7. 点击"发布文章"完成发布

### 在编辑文章时使用

1. 打开文章编辑页面：`/posts/[slug]/edit`
2. 在"SEO 设置"卡片中，找到"SEO 标题"字段
3. 点击右上角的"AI 生成"按钮
4. 等待 AI 生成完成
5. 生成的 SEO 标题、描述和摘要会自动填充
6. 可以手动编辑生成的内容
7. 点击"保存"完成更新

## 🔧 技术实现

### Server Action

```typescript
// app/actions/ai/seo.ts
export async function generateSEO(
  title: string,
  content: string
): Promise<SEOGenerationResult>
```

**功能**：
- 接收文章标题和内容
- 调用 AI 模型生成 SEO 元数据
- 解析返回结果（支持 JSON 和 Markdown 格式）
- 返回结构化的 SEO 数据

### AI 模型支持

- **OpenAI**：优先使用（如果配置了 `OPENAI_API_KEY`）
  - 使用 `gpt-3.5-turbo` 或 `gpt-4o-mini`
  - 通过 `generateText` API 调用
  
- **Ollama**：本地模型（如果没有配置 OpenAI）
  - 使用推荐的模型（如 `llama3.1:8b`）
  - 通过 HTTP API 调用

### 结果解析

AI 返回的结果可能有两种格式：

1. **JSON 格式**（推荐）：
```json
{
  "metaTitle": "优化后的标题",
  "metaDescription": "SEO 描述",
  "excerpt": "文章摘要",
  "keywords": ["关键词1", "关键词2"]
}
```

2. **Markdown 格式**（备用）：
```markdown
**标题**: 优化后的标题
**描述**: SEO 描述
**摘要**: 文章摘要
**关键词**: 关键词1, 关键词2
```

系统会自动识别并解析这两种格式。

## 📝 代码文件清单

### 新增文件
- `app/actions/ai/seo.ts` - SEO 生成 Server Action
- `docs/AI_SEO_GENERATION.md` - 功能文档（本文档）

### 修改文件
- `lib/ai/prompts.ts` - 添加 SEO 生成提示词模板
- `components/posts/publish-note-client.tsx` - 添加 AI 生成按钮
- `components/posts/post-editor.tsx` - 添加 AI 生成按钮

## 🎨 UI 设计

### AI 生成按钮

- **位置**：SEO 标题字段的右上角
- **图标**：✨ Sparkles 图标
- **状态**：
  - 正常：显示"AI 生成"文字和图标
  - 加载中：显示"生成中..."和 Spinner
  - 禁用：在表单提交时禁用

### 用户体验

1. **即时反馈**：点击按钮后立即显示加载状态
2. **自动填充**：生成完成后自动填充到表单字段
3. **可编辑**：生成的内容可以手动编辑
4. **错误提示**：如果生成失败，显示友好的错误提示

## 🐛 已知问题和限制

1. **内容长度限制**：为了控制 token 使用，内容会被截断到 5000 字符
2. **生成时间**：根据模型和内容长度，生成可能需要 3-10 秒
3. **格式解析**：如果 AI 返回的格式不符合预期，可能解析失败（会使用默认值）

## 🔮 未来改进

- [ ] 支持批量生成多篇文章的 SEO
- [ ] 添加 SEO 评分和建议
- [ ] 支持自定义 Prompt 模板
- [ ] 缓存生成结果，避免重复生成
- [ ] 支持生成多语言 SEO 内容

---

**最后更新**：2024-12-05

