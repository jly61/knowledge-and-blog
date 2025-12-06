"use server"

/**
 * AI SEO 生成 Server Actions
 *
 * 用于自动生成文章的 SEO 元数据（标题、描述、摘要）
 */

import { generateText } from "ai"
import { aiModel } from "@/lib/ai/client"
import { getRecommendedModel } from "@/lib/ai/ollama-client"
import { SEO_GENERATION_PROMPT } from "@/lib/ai/prompts"

/**
 * SEO 生成结果接口
 */
export interface SEOGenerationResult {
  /** SEO 标题（优化后的标题） */
  metaTitle: string
  /** SEO 描述（用于 meta description） */
  metaDescription: string
  /** 文章摘要（用于预览和列表页） */
  excerpt: string
  /** SEO 关键词（可选） */
  keywords?: string[]
}

/**
 * 生成文章的 SEO 元数据
 *
 * @param title - 文章标题
 * @param content - 文章内容
 * @returns SEO 元数据（标题、描述、摘要）
 */
export async function generateSEO(
  title: string,
  content: string
): Promise<SEOGenerationResult> {
  try {
    // 构建提示词
    const prompt = SEO_GENERATION_PROMPT.replace("{{TITLE}}", title).replace(
      "{{CONTENT}}",
      content.substring(0, 5000) // 限制内容长度，避免 token 过多
    )

    // 优先使用 OpenAI
    if (process.env.OPENAI_API_KEY && aiModel) {
      const result = await generateText({
        model: aiModel,
        prompt,
        maxSteps: 1,
        temperature: 0.7,
      })

      return parseSEOResponse(result.text)
    }

    // 使用 Ollama 本地模型
    try {
      const model = await getRecommendedModel()
      const { ollamaClient } = await import("@/lib/ai/ollama-client")

      const response = await ollamaClient.chat({
        model,
        messages: [
          {
            role: "system",
            content: "你是一个专业的 SEO 优化专家，擅长生成高质量的 SEO 元数据。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      return parseSEOResponse(response.message.content)
    } catch (ollamaError) {
      console.error("Ollama SEO generation error:", ollamaError)
      throw new Error(
        "Ollama 服务不可用。请确保 Ollama 已安装并运行。"
      )
    }
  } catch (error) {
    console.error("SEO generation error:", error)
    throw new Error(
      error instanceof Error
        ? `SEO 生成失败: ${error.message}`
        : "SEO 生成失败"
    )
  }
}

/**
 * 解析 AI 返回的 SEO 响应
 *
 * @param text - AI 返回的文本
 * @returns 解析后的 SEO 数据
 */
function parseSEOResponse(text: string): SEOGenerationResult {
  // 尝试解析 JSON 格式
  try {
    // 查找 JSON 对象
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        metaTitle: parsed.metaTitle || parsed.title || "",
        metaDescription: parsed.metaDescription || parsed.description || "",
        excerpt: parsed.excerpt || parsed.summary || "",
        keywords: parsed.keywords || undefined,
      }
    }
  } catch {
    // 如果 JSON 解析失败，尝试其他格式
  }

  // 尝试解析 Markdown 格式
  try {
    const lines = text.split("\n")
    let metaTitle = ""
    let metaDescription = ""
    let excerpt = ""
    let keywords: string[] | undefined

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith("**标题**") || line.startsWith("标题:") || line.startsWith("# 标题")) {
        metaTitle = extractValue(lines, i)
      } else if (
        line.startsWith("**描述**") ||
        line.startsWith("描述:") ||
        line.startsWith("**SEO 描述**")
      ) {
        metaDescription = extractValue(lines, i)
      } else if (
        line.startsWith("**摘要**") ||
        line.startsWith("摘要:") ||
        line.startsWith("**文章摘要**")
      ) {
        excerpt = extractValue(lines, i)
      } else if (
        line.startsWith("**关键词**") ||
        line.startsWith("关键词:") ||
        line.startsWith("**SEO 关键词**")
      ) {
        const keywordsStr = extractValue(lines, i)
        keywords = keywordsStr
          .split(/[,，、]/)
          .map((k) => k.trim())
          .filter(Boolean)
      }
    }

    // 如果找到了数据，返回
    if (metaTitle || metaDescription || excerpt) {
      return {
        metaTitle: metaTitle || "",
        metaDescription: metaDescription || "",
        excerpt: excerpt || metaDescription || "",
        keywords,
      }
    }
  } catch {
    // 解析失败
  }

  // 如果所有解析都失败，返回默认值
  // 尝试提取前几行作为摘要
  const lines = text.split("\n").filter((l) => l.trim())
  const firstLine = lines[0]?.trim() || ""
  const secondLine = lines[1]?.trim() || ""

  return {
    metaTitle: firstLine.substring(0, 60) || "",
    metaDescription: secondLine.substring(0, 160) || firstLine.substring(0, 160) || "",
    excerpt: secondLine.substring(0, 200) || firstLine.substring(0, 200) || "",
  }
}

/**
 * 从文本中提取值（处理多行情况）
 */
function extractValue(lines: string[], startIndex: number): string {
  const line = lines[startIndex]
  // 尝试从当前行提取
  const match = line.match(/[:：]\s*(.+)/)
  if (match) {
    return match[1].trim()
  }

  // 如果当前行没有值，尝试下一行
  if (startIndex + 1 < lines.length) {
    const nextLine = lines[startIndex + 1].trim()
    if (nextLine && !nextLine.startsWith("**") && !nextLine.startsWith("#")) {
      return nextLine
    }
  }

  return ""
}

