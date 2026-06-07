import { streamText } from "ai"
import { aiModel } from "@/lib/ai/client"
import { getRecommendedModel } from "@/lib/ai/ollama-client"
import { checkRateLimit, recordApiUsage } from "@/lib/ai/rate-limit"

/**
 * 编辑器操作类型
 */
export type EditorAction = "polish" | "expand" | "summarize" | "translate"

/**
 * 翻译目标语言
 */
export type TargetLanguage = "en" | "zh" | "ja" | "ko" | "fr" | "de" | "es"

/**
 * 编辑器助手操作提示词
 */
const ACTION_PROMPTS: Record<EditorAction, string> = {
  polish: `请润色以下文本，使其更加流畅、专业、易读。保持原意不变，只优化表达方式。

文本：
{{TEXT}}

要求：
- 保持原意和核心内容不变
- 优化语言表达，使其更加流畅
- 修正语法错误和错别字
- 保持原文的风格和语气
- 只返回润色后的文本，不要添加任何解释或说明`,

  expand: `请扩写以下文本，使其更加详细、丰富、完整。保持原意不变，增加更多细节和说明。

文本：
{{TEXT}}

要求：
- 保持原意和核心观点不变
- 增加更多细节、例子、说明
- 使内容更加完整和深入
- 保持原文的风格和语气
- 扩写后的文本长度应为原文的 1.5-2 倍
- 只返回扩写后的文本，不要添加任何解释或说明`,

  summarize: `请缩写以下文本，提取核心要点，使其更加简洁、精炼。保持原意不变，删除冗余内容。

文本：
{{TEXT}}

要求：
- 保持核心观点和关键信息
- 删除冗余和重复内容
- 使文本更加简洁精炼
- 保持原文的风格和语气
- 缩写后的文本长度应为原文的 50%-70%
- 只返回缩写后的文本，不要添加任何解释或说明`,

  translate: `请将以下文本翻译成目标语言。保持原意和语气不变。

文本：
{{TEXT}}

目标语言：{{TARGET_LANG}}

要求：
- 准确翻译，保持原意不变
- 保持原文的语气和风格
- 使用自然流畅的目标语言表达
- 只返回翻译后的文本，不要添加任何解释或说明`,
}

/**
 * 语言名称映射
 */
const LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  en: "英语",
  zh: "中文",
  ja: "日语",
  ko: "韩语",
  fr: "法语",
  de: "德语",
  es: "西班牙语",
}

/**
 * 编辑器助手 API 路由
 * 支持流式响应，用于润色、扩写、缩写、翻译等功能
 */
export async function POST(req: Request) {
  try {
    const { action, text, targetLang } = await req.json()

    if (!action || !text) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数：action 和 text" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // 检查限流（仅对 DeepSeek/OpenAI 进行限流，Ollama 不限流）
    if (aiModel) {
      const rateLimitResponse = await checkRateLimit(text)
      if (rateLimitResponse) {
        return rateLimitResponse
      }
    }

    // 构建提示词
    let prompt = ACTION_PROMPTS[action as EditorAction]?.replace("{{TEXT}}", text)
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: `不支持的操作类型: ${action}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (action === "translate" && targetLang) {
      prompt = prompt.replace("{{TARGET_LANG}}", LANGUAGE_NAMES[targetLang as TargetLanguage] || "英语")
    }

    // 限制文本长度，避免 token 过多
    const maxLength = 3000
    const processedText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text
    if (text.length > maxLength) {
      prompt = ACTION_PROMPTS[action as EditorAction].replace("{{TEXT}}", processedText)
      if (action === "translate" && targetLang) {
        prompt = prompt.replace("{{TARGET_LANG}}", LANGUAGE_NAMES[targetLang as TargetLanguage] || "英语")
      }
    }

    // 优先使用 DeepSeek 或 OpenAI（如果配置了）
    if (aiModel) {
      const result = await streamText({
        model: aiModel,
        prompt,
        temperature: 0.7,
      })

      // 记录使用情况（异步，不阻塞响应）
      // 注意：流式响应无法直接获取完整输出，使用估算值
      recordApiUsage(text)

      // AI SDK v5 使用 toTextStreamResponse
      return result.toTextStreamResponse()
    }

    // 使用 Ollama 本地模型（如果没有配置 DeepSeek 或 OpenAI）
    try {
      const model = await getRecommendedModel()
      const { ollamaClient } = await import("@/lib/ai/ollama-client")

      const response = await ollamaClient.chat({
        model,
        messages: [
          {
            role: "system",
            content: "你是一个专业的文本编辑助手，擅长润色、扩写、缩写和翻译文本。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
      })

      // 创建符合 AI SDK 格式的流式响应
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              if (chunk.message?.content) {
                // AI SDK 数据流格式：前缀 + JSON 数据 + 换行
                const data = JSON.stringify({
                  type: "text-delta",
                  textDelta: chunk.message.content,
                })
                // 格式：0:{"type":"text-delta","textDelta":"..."}\n
                controller.enqueue(encoder.encode(`0:${data}\n`))
              }
            }
            // 发送完成标记
            const finishData = JSON.stringify({ type: "finish" })
            controller.enqueue(encoder.encode(`d:${finishData}\n`))
            controller.close()
          } catch (error) {
            console.error("Ollama stream error:", error)
            const errorData = JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "未知错误",
            })
            controller.enqueue(encoder.encode(`e:${errorData}\n`))
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no", // 禁用 nginx 缓冲
        },
      })
    } catch (ollamaError) {
      console.error("Ollama editor assistant error:", ollamaError)
      return new Response(
        JSON.stringify({
          error: "Ollama 服务不可用。请确保 Ollama 已安装并运行。",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  } catch (error) {
    console.error("Editor assistant API error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? `编辑器助手操作失败: ${error.message}`
          : "编辑器助手操作失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

