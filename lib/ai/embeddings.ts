/**
 * 向量嵌入生成
 *
 * 支持 OpenAI 和 Ollama 本地嵌入模型
 * 优先使用 OpenAI，如果没有配置则使用 Ollama
 */

import { createOpenAI } from "@ai-sdk/openai"

/**
 * 生成文本的向量嵌入
 *
 * @param text - 要向量化的文本
 * @param maxRetries - 最大重试次数，默认 3
 * @returns 向量数组（1536 维，OpenAI text-embedding-3-small）
 */
export async function generateEmbedding(
  text: string,
  maxRetries: number = 3
): Promise<number[]> {
  // 限制文本长度（Ollama 可能有长度限制，且处理长文本容易超时）
  // 如果文本太长，截取前 5000 个字符（保留标题）
  // 减少长度限制，避免 Ollama 处理超时
  const MAX_TEXT_LENGTH = 5000
  let textToProcess = text
  if (text.length > MAX_TEXT_LENGTH) {
    const lines = text.split("\n")
    const title = lines[0] || ""
    const rest = lines.slice(1).join("\n")
    // 保留标题，截取内容部分
    debugger
    const contentLength = MAX_TEXT_LENGTH - title.length - 10 // 留一些余量
    textToProcess = title + "\n\n" + rest.substring(0, contentLength)
    console.warn(
      `文本长度 (${text.length}) 超过限制 (${MAX_TEXT_LENGTH})，已截断为 ${textToProcess.length} 字符`
    )
  }
  // 优先使用 OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error("OpenAI embedding error:", error)
      throw error
    }
  }

  // 使用 Ollama 本地模型（带重试机制）
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434"

  // 尝试使用 nomic-embed 模型（专门用于嵌入）
  let embeddingModel = "nomic-embed-text"

  // 检查模型是否可用
  try {
    const modelsResponse = await fetch(`${ollamaBaseUrl}/api/tags`)
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json()
      const availableModels = modelsData.models?.map((m: any) => m.name) || []

      // 优先使用 nomic-embed-text，如果没有则使用其他可用模型
      if (!availableModels.includes(embeddingModel)) {
        // 尝试其他嵌入模型
        const alternativeModels = ["nomic-embed", "all-minilm"]
        embeddingModel = alternativeModels.find((m) => availableModels.includes(m)) || availableModels[0]

        if (!embeddingModel) {
          throw new Error("未找到可用的嵌入模型。请运行 `ollama pull nomic-embed-text` 下载模型。")
        }
      }
    }
  } catch (error) {
    console.warn("获取 Ollama 模型列表失败，使用默认模型:", error)
  }

  // 重试逻辑
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // 创建超时控制器（30秒超时）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // 直接调用 Ollama HTTP API
      const response = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: embeddingModel,
          prompt: textToProcess,
        }),
        signal: controller.signal, // 添加超时控制
      })

      clearTimeout(timeoutId) // 清除超时定时器

      if (!response.ok) {
        // 尝试读取错误响应体
        let errorMessage = `Ollama API error: ${response.statusText}`
        try {
          const errorData = await response.text()
          if (errorData) {
            errorMessage += ` - ${errorData.substring(0, 200)}`
          }
        } catch {
          // 忽略读取错误体的错误
        }

        // 如果是 500 错误且还有重试机会，继续重试
        if (response.status === 500 && attempt < maxRetries) {
          console.warn(
            `Ollama API 返回 500 错误，${attempt}/${maxRetries} 次尝试失败，将在 ${attempt * 2} 秒后重试...`
          )
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000)) // 指数退避
          continue
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      const embedding = data.embedding

      // OpenAI text-embedding-3-small 是 1536 维
      // 如果 Ollama 返回的维度不同，需要处理
      if (embedding.length !== 1536) {
        console.warn(
          `Ollama 嵌入维度 (${embedding.length}) 与预期 (1536) 不匹配，将进行调整`
        )

        // 如果维度更小，用零填充
        if (embedding.length < 1536) {
          return [...embedding, ...new Array(1536 - embedding.length).fill(0)]
        }

        // 如果维度更大，截断
        return embedding.slice(0, 1536)
      }

      return embedding
    } catch (error) {
      clearTimeout(timeoutId) // 确保清除超时定时器

      // 检查是否是超时错误
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error("请求超时（30秒），文本可能过长或 Ollama 服务响应慢")
      } else {
        lastError = error instanceof Error ? error : new Error(String(error))
      }

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        break
      }

      // 等待后重试（指数退避）
      console.warn(
        `向量嵌入生成失败 (${attempt}/${maxRetries})，将在 ${attempt * 2} 秒后重试...`,
        lastError.message
      )
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
    }
  }

  // 所有重试都失败
  console.error("Ollama embedding error (所有重试均失败):", lastError)
  throw new Error(
    `向量嵌入生成失败（已重试 ${maxRetries} 次）。请确保 Ollama 已安装并运行，且已下载嵌入模型（如：\`ollama pull nomic-embed-text\`）。错误: ${
      lastError?.message || "未知错误"
    }`
  )
}

/**
 * 批量生成向量嵌入
 *
 * @param texts - 要向量化的文本数组
 * @returns 向量数组的数组
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // OpenAI 支持批量处理
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: texts,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.error("OpenAI batch embedding error:", error)
      throw error
    }
  }

  // Ollama 需要逐个处理
  const embeddings: number[][] = []
  for (const text of texts) {
    const embedding = await generateEmbedding(text)
    embeddings.push(embedding)
  }
  return embeddings
}

