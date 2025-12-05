# AI 功能快速开始指南

## 🚀 使用 Ollama 本地模型（免费）

### 第一步：安装 Ollama

#### macOS
```bash
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### Windows
访问 https://ollama.ai 下载安装包

### 第二步：启动 Ollama 服务

安装后，Ollama 服务通常会自动启动。如果没有，手动启动：

```bash
ollama serve
```

服务运行在 `http://localhost:11434`

### 第三步：下载模型

推荐下载 Llama 3.1 8B（性能好，约 4.7GB）：

```bash
ollama pull llama3.1:8b
```

其他可选模型：
- `mistral:7b` - 更轻量（约 4.1GB）
- `llama3.1:70b` - 更强但更大（约 40GB，需要更多内存）

### 第四步：验证安装

```bash
# 测试模型是否可用
ollama run llama3.1:8b "你好，请介绍一下自己"
```

如果看到回复，说明安装成功！

### 第五步：启动项目

```bash
# 确保没有配置 OPENAI_API_KEY（或删除它）
# 项目会自动使用 Ollama

pnpm dev
```

### 第六步：测试 AI 功能

1. 打开任意笔记详情页（`/notes/[id]`）
2. 点击右下角的聊天按钮
3. 开始与 AI 对话！

## 🔧 故障排查

### 问题 1：提示 "Ollama 服务不可用"

**解决方案**：
1. 检查 Ollama 是否运行：
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. 如果没有运行，启动服务：
   ```bash
   ollama serve
   ```

### 问题 2：提示 "模型不存在"

**解决方案**：
1. 查看已下载的模型：
   ```bash
   ollama list
   ```
2. 如果没有模型，下载一个：
   ```bash
   ollama pull llama3.1:8b
   ```

### 问题 3：响应很慢

**可能原因**：
- 模型太大（如 70B）
- 内存不足
- CPU 性能不足

**解决方案**：
- 使用更小的模型（如 `llama3.1:8b` 或 `mistral:7b`）
- 确保有足够的可用内存（至少 8GB）

### 问题 4：内存不足

**解决方案**：
- 关闭其他占用内存的应用
- 使用更小的模型
- 确保至少有 8GB 可用内存

## 📊 性能参考

| 模型 | 大小 | 内存需求 | 速度 | 质量 |
|------|------|---------|------|------|
| llama3.1:8b | 4.7GB | 8GB+ | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| mistral:7b | 4.1GB | 8GB+ | ⚡⚡⚡ | ⭐⭐⭐ |
| llama3.1:70b | 40GB | 48GB+ | ⚡ | ⭐⭐⭐⭐⭐ |

## 💡 使用 OpenAI（可选）

如果你想使用 OpenAI API（需要付费但更快）：

1. 获取 API Key：https://platform.openai.com/api-keys
2. 在 `.env.local` 中添加：
   ```env
   OPENAI_API_KEY="sk-your-api-key"
   ```
3. 项目会自动优先使用 OpenAI

## 📚 更多信息

- [Ollama 详细设置指南](./OLLAMA_SETUP.md)
- [AI 功能开发规划](./AI_FEATURES_PLAN.md)


