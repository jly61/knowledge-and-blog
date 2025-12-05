import { openai } from "@ai-sdk/openai"

/**
 * AI 客户端配置
 * 支持 OpenAI 和本地模型（Ollama）
 * 优先使用 OpenAI，如果没有配置则使用 Ollama
 */

// 检查是否使用 OpenAI
const useOpenAI = !!process.env.OPENAI_API_KEY

// 导出 AI 模型
export const aiModel = useOpenAI
  ? openai("gpt-3.5-turbo") // 或 "gpt-4o-mini" 更便宜
  : null // 如果使用 Ollama，需要在 API 路由中单独配置

// 导出配置
export const aiConfig = {
  useOpenAI,
  model: useOpenAI ? "gpt-3.5-turbo" : "ollama",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
}

