import { openai } from "@ai-sdk/openai"

/**
 * AI 客户端配置
 * 支持优先级：DeepSeek > OpenAI > Ollama
 * DeepSeek 和 OpenAI 使用相同的 API 格式，但需要不同的 baseURL
 */

// 检查是否使用 DeepSeek（优先）
const useDeepSeek = !!process.env.DEEPSEEK_API_KEY

// 检查是否使用 OpenAI
const useOpenAI = !!process.env.OPENAI_API_KEY && !useDeepSeek

// 导出 AI 模型
export const aiModel = useDeepSeek
  ? openai({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEPSEEK_API_KEY,
    })("deepseek-chat")
  : useOpenAI
  ? openai("gpt-3.5-turbo") // 或 "gpt-4o-mini" 更便宜
  : null // 如果使用 Ollama，需要在 API 路由中单独配置

// 导出配置
export const aiConfig = {
  useDeepSeek,
  useOpenAI,
  model: useDeepSeek ? "deepseek-chat" : useOpenAI ? "gpt-3.5-turbo" : "ollama",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
}

