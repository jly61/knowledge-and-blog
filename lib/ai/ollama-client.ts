import { Ollama } from "ollama"

/**
 * Ollama 客户端配置
 * 延迟初始化，避免启动时连接失败
 */
let ollamaClientInstance: Ollama | null = null

export function getOllamaClient(): Ollama {
  if (!ollamaClientInstance) {
    ollamaClientInstance = new Ollama({
      host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    })
  }
  return ollamaClientInstance
}

// 为了向后兼容，导出 ollamaClient 对象
export const ollamaClient = {
  chat: (options: any) => getOllamaClient().chat(options),
  list: () => getOllamaClient().list(),
}

/**
 * 获取推荐的模型
 * 优先使用 Llama 3.1，如果没有则尝试其他模型
 */
export async function getRecommendedModel(): Promise<string> {
  try {
    // 尝试获取可用模型列表
    const models = await ollamaClient.list()
    const availableModels = models.models.map((m) => m.name)

    // 优先使用的模型列表（按优先级排序）
    const preferredModels = [
      "llama3.1:8b",
      "llama3.1",
      "llama3:8b",
      "llama3",
      "mistral:7b",
      "mistral",
    ]

    // 查找第一个可用的模型
    for (const model of preferredModels) {
      if (availableModels.some((m) => m.includes(model.split(":")[0]))) {
        return model
      }
    }

    // 如果没有找到，返回第一个可用模型或默认模型
    return availableModels[0] || "llama3.1:8b"
  } catch (error) {
    console.error("Failed to get Ollama models:", error)
    // 默认返回 Llama 3.1
    return "llama3.1:8b"
  }
}

