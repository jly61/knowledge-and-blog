# Ollama 本地模型设置指南

## 什么是 Ollama？

Ollama 是一个本地运行大型语言模型的工具，完全免费，不需要 API Key。

## 安装 Ollama

### macOS

```bash
# 使用 Homebrew
brew install ollama

# 或下载安装包
# 访问 https://ollama.ai 下载
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

访问 https://ollama.ai 下载 Windows 安装包

## 启动 Ollama 服务

安装后，Ollama 服务会自动启动。如果没有运行，可以手动启动：

```bash
ollama serve
```

服务默认运行在 `http://localhost:11434`

## 下载模型

推荐下载以下模型之一：

```bash
# Llama 3.1 8B（推荐，性能好，约 4.7GB）
ollama pull llama3.1:8b

# 或 Llama 3.1 70B（更强但更大，约 40GB）
ollama pull llama3.1:70b

# 或 Mistral 7B（轻量级，约 4.1GB）
ollama pull mistral:7b
```

## 验证安装

```bash
# 测试模型是否可用
ollama run llama3.1:8b "你好"
```

如果看到回复，说明安装成功！

## 在项目中使用

### 1. 确保 Ollama 服务运行

```bash
# 检查服务是否运行
curl http://localhost:11434/api/tags
```

### 2. 配置环境变量（可选）

在 `.env.local` 中：

```env
# 如果 Ollama 运行在其他地址，可以配置
OLLAMA_BASE_URL="http://localhost:11434"
```

### 3. 启动项目

```bash
pnpm dev
```

现在 AI 功能会自动使用 Ollama 本地模型！

## 常见问题

### Q: 如何查看已下载的模型？

```bash
ollama list
```

### Q: 如何删除不需要的模型？

```bash
ollama rm model-name
```

### Q: 模型下载很慢怎么办？

- 使用国内镜像（如果有）
- 或使用代理
- 或选择更小的模型（如 `mistral:7b`）

### Q: 内存不足怎么办？

- 使用更小的模型（如 `llama3.1:8b`）
- 关闭其他占用内存的应用
- 至少需要 8GB 可用内存

### Q: 如何更新模型？

```bash
ollama pull llama3.1:8b  # 会自动更新到最新版本
```

## 性能对比

| 模型 | 大小 | 内存需求 | 速度 | 质量 |
|------|------|---------|------|------|
| llama3.1:8b | 4.7GB | 8GB+ | 快 | ⭐⭐⭐⭐ |
| llama3.1:70b | 40GB | 48GB+ | 慢 | ⭐⭐⭐⭐⭐ |
| mistral:7b | 4.1GB | 8GB+ | 快 | ⭐⭐⭐ |

## 推荐配置

- **开发/测试**：`llama3.1:8b`（平衡性能和资源）
- **生产环境**：如果服务器资源充足，可以使用 `llama3.1:70b`
- **资源受限**：`mistral:7b`（更轻量）


