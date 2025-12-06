import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { BASE_SYSTEM_PROMPT } from "@/lib/ai/prompts"
import { getRecommendedModel } from "@/lib/ai/ollama-client"
import { getCurrentNoteContext, retrieveRelevantNotes, buildRAGContext } from "@/lib/ai/rag"
import { auth } from "@/lib/auth"

/**
 * 聊天 API 路由
 * 支持 OpenAI 和 Ollama 本地模型
 * 优先使用 OpenAI，如果没有配置则使用 Ollama
 * 支持 RAG（知识库问答）：如果提供了 noteId，会检索相关笔记并注入上下文
 */
export async function POST(req: Request) {
  try {
    const { messages, noteId } = await req.json()
    
    // 获取用户会话（用于 RAG 检索）
    const session = await auth()
    const userId = session?.user?.id

    // 构建系统提示（包含 RAG 上下文）
    let systemPrompt = BASE_SYSTEM_PROMPT
    
    // 如果提供了 noteId 和 userId，启用 RAG
    if (noteId && userId) {
      try {
        // 获取当前笔记上下文
        const currentNote = await getCurrentNoteContext(noteId, userId)
        
        // 获取最后一条用户消息（用于检索）
        const lastUserMessage = messages
          .filter((m: { role: string }) => m.role === "user")
          .pop()
        
        if (lastUserMessage?.content) {
          // 检索相关笔记
          const relevantNotes = await retrieveRelevantNotes(
            lastUserMessage.content,
            userId,
            5, // 最多检索 5 条相关笔记
            0.7 // 相似度阈值
          )

          // 构建 RAG 上下文
          if (currentNote || relevantNotes.length > 0) {
            let ragContext = ""
            
            // 添加当前笔记上下文
            if (currentNote) {
              ragContext += `当前笔记：\n标题：${currentNote.title}\n内容：${currentNote.content}\n\n`
            }
            
            // 添加相关笔记上下文
            if (relevantNotes.length > 0) {
              ragContext += "相关笔记：\n"
              relevantNotes.forEach((note, index) => {
                ragContext += `${index + 1}. [${note.title}] (相似度: ${(note.similarity * 100).toFixed(1)}%)\n`
                ragContext += `${note.content.substring(0, 500)}${note.content.length > 500 ? "..." : ""}\n\n`
              })
            }
            
            systemPrompt += `\n\n${ragContext}\n请基于上述笔记内容回答问题。如果笔记中没有相关信息，请说明。回答时请引用具体的笔记标题。`
          }
        }
      } catch (ragError) {
        console.error("RAG context error:", ragError)
        // RAG 失败不影响基础对话功能
      }
    }

    // 优先使用 OpenAI
    if (process.env.OPENAI_API_KEY) {
      const result = await streamText({
        model: openai("gpt-3.5-turbo"),
        system: systemPrompt,
        messages: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      })

      // AI SDK v5 使用 toTextStreamResponse
      return result.toTextStreamResponse()
    }

    // 使用 Ollama 本地模型
    try {
      // 先检查 Ollama 服务是否可用（使用动态导入避免启动时连接）
      const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
      try {
        // 创建超时控制器
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时

        const healthCheck = await fetch(`${ollamaBaseUrl}/api/tags`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!healthCheck.ok) {
          throw new Error("Ollama 服务不可用")
        }
      } catch (healthError) {
        return new Response(
          JSON.stringify({
            error:
              "Ollama 服务不可用。请确保 Ollama 已安装并运行。\n\n解决方法：\n1. 检查 Ollama 是否运行: curl http://localhost:11434/api/tags\n2. 如果没有运行，启动服务: brew services start ollama\n3. 或手动启动: ollama serve",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      const model = await getRecommendedModel()

      // 构建消息格式（Ollama 需要 system 消息合并到 messages 中）
      const ollamaMessages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
      ]

      // 调用 Ollama API（流式响应）
      const { ollamaClient } = await import("@/lib/ai/ollama-client")
      const response = await ollamaClient.chat({
        model,
        messages: ollamaMessages as any,
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
      console.error("Ollama error:", ollamaError)
      return new Response(
        JSON.stringify({
          error:
            "Ollama 服务不可用。请确保 Ollama 已安装并运行。\n\n安装方法：\n1. 访问 https://ollama.ai 下载安装\n2. 运行: ollama serve\n3. 下载模型: ollama pull llama3.1:8b",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "聊天服务出错",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

