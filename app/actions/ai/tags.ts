"use server"

/**
 * AI 标签推荐 Server Actions
 *
 * 用于根据文章/笔记内容自动推荐标签和分类
 */

import { generateText } from "ai"
import { aiModel } from "@/lib/ai/client"
import { getRecommendedModel } from "@/lib/ai/ollama-client"
import { TAG_RECOMMENDATION_PROMPT } from "@/lib/ai/prompts"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

/**
 * 标签推荐结果接口
 */
export interface TagRecommendationResult {
  /** 推荐的标签 ID 列表 */
  tagIds: string[]
  /** 推荐的分类 ID（可选） */
  categoryId?: string
  /** 推荐理由（可选） */
  reasons?: {
    tagId: string
    reason: string
  }[]
}

/**
 * 根据内容推荐标签和分类
 *
 * @param title - 文章/笔记标题
 * @param content - 文章/笔记内容
 * @param existingTagIds - 已选择的标签 ID 列表（可选）
 * @returns 推荐的标签 ID 列表和分类 ID
 */
export async function recommendTags(
  title: string,
  content: string,
  existingTagIds: string[] = []
): Promise<TagRecommendationResult> {
  try {
    // 获取所有可用标签
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未授权")
    }

    const allTags = await db.tag.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
      },
    })

    const allCategories = await db.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
      },
    })

    // 构建标签和分类列表字符串
    const tagsList = allTags.map((tag) => `- ${tag.name} (ID: ${tag.id})`).join("\n")
    const categoriesList = allCategories
      .map((cat) => `- ${cat.name} (ID: ${cat.id})`)
      .join("\n")

    // 构建提示词
    const prompt = TAG_RECOMMENDATION_PROMPT.replace("{{TITLE}}", title)
      .replace("{{CONTENT}}", content.substring(0, 5000)) // 限制内容长度
      .replace("{{TAGS_LIST}}", tagsList || "暂无标签")
      .replace("{{CATEGORIES_LIST}}", categoriesList || "暂无分类")
      .replace("{{EXISTING_TAGS}}", existingTagIds.join(", ") || "无")

    // 优先使用 OpenAI
    if (process.env.OPENAI_API_KEY && aiModel) {
      const result = await generateText({
        model: aiModel,
        prompt,
        temperature: 0.7,
      })

      return parseTagRecommendation(result.text, allTags, allCategories)
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
            content:
              "你是一个专业的内容分类专家，擅长根据文章内容推荐合适的标签和分类。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      })

      // Ollama 返回的是异步迭代器，需要获取最终结果
      let finalContent = ""
      for await (const chunk of response) {
        if (chunk.message?.content) {
          finalContent += chunk.message.content
        }
      }

      return parseTagRecommendation(finalContent, allTags, allCategories)
    } catch (ollamaError) {
      console.error("Ollama tag recommendation error:", ollamaError)
      throw new Error("Ollama 服务不可用。请确保 Ollama 已安装并运行。")
    }
  } catch (error) {
    console.error("Tag recommendation error:", error)
    throw new Error(
      error instanceof Error ? `标签推荐失败: ${error.message}` : "标签推荐失败"
    )
  }
}

/**
 * 解析 AI 返回的标签推荐结果
 *
 * @param text - AI 返回的文本
 * @param allTags - 所有可用标签
 * @param allCategories - 所有可用分类
 * @returns 解析后的推荐结果
 */
function parseTagRecommendation(
  text: string,
  allTags: Array<{ id: string; name: string }>,
  allCategories: Array<{ id: string; name: string }>
): TagRecommendationResult {
  // 创建名称到 ID 的映射
  const tagNameToId = new Map(allTags.map((tag) => [tag.name.toLowerCase(), tag.id]))
  const categoryNameToId = new Map(
    allCategories.map((cat) => [cat.name.toLowerCase(), cat.id])
  )

  let tagIds: string[] = []
  let categoryId: string | undefined
  const reasons: { tagId: string; reason: string }[] = []

  // 尝试解析 JSON 格式
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // 解析标签
      if (parsed.tags && Array.isArray(parsed.tags)) {
        for (const tagName of parsed.tags) {
          const tagId = tagNameToId.get(tagName.toLowerCase())
          if (tagId) {
            tagIds.push(tagId)
            if (parsed.reasons && parsed.reasons[tagName]) {
              reasons.push({
                tagId,
                reason: parsed.reasons[tagName],
              })
            }
          }
        }
      }

      // 解析分类
      if (parsed.category) {
        const catId = categoryNameToId.get(parsed.category.toLowerCase())
        if (catId) {
          categoryId = catId
        }
      }

      if (tagIds.length > 0 || categoryId) {
        return { tagIds, categoryId, reasons: reasons.length > 0 ? reasons : undefined }
      }
    }
  } catch {
    // JSON 解析失败，尝试其他格式
  }

  // 尝试解析 Markdown 格式
  try {
    const lines = text.split("\n")
    let inTagsSection = false
    let inCategorySection = false

    for (const line of lines) {
      const trimmed = line.trim()

      // 检测标签部分
      if (
        trimmed.includes("标签") ||
        trimmed.includes("推荐标签") ||
        trimmed.includes("**标签**")
      ) {
        inTagsSection = true
        inCategorySection = false
        continue
      }

      // 检测分类部分
      if (
        trimmed.includes("分类") ||
        trimmed.includes("推荐分类") ||
        trimmed.includes("**分类**")
      ) {
        inCategorySection = true
        inTagsSection = false
        continue
      }

      // 解析标签
      if (inTagsSection) {
        // 尝试提取标签名称（支持多种格式）
        const tagMatch =
          trimmed.match(/[-*•]\s*(.+?)(?:\s*\(|$)/) ||
          trimmed.match(/^\d+\.\s*(.+?)(?:\s*\(|$)/) ||
          trimmed.match(/^(.+?)(?:\s*[:：]|$)/)

        if (tagMatch) {
          const tagName = tagMatch[1].trim()
          const tagId = tagNameToId.get(tagName.toLowerCase())
          if (tagId && !tagIds.includes(tagId)) {
            tagIds.push(tagId)
          }
        }
      }

      // 解析分类
      if (inCategorySection) {
        const categoryMatch =
          trimmed.match(/[-*•]\s*(.+?)(?:\s*\(|$)/) ||
          trimmed.match(/^\d+\.\s*(.+?)(?:\s*\(|$)/) ||
          trimmed.match(/^(.+?)(?:\s*[:：]|$)/)

        if (categoryMatch) {
          const categoryName = categoryMatch[1].trim()
          const catId = categoryNameToId.get(categoryName.toLowerCase())
          if (catId) {
            categoryId = catId
            break // 分类通常只有一个
          }
        }
      }
    }

    if (tagIds.length > 0 || categoryId) {
      return { tagIds, categoryId, reasons: reasons.length > 0 ? reasons : undefined }
    }
  } catch {
    // Markdown 解析失败
  }

  // 如果所有解析都失败，尝试简单匹配
  const lowerText = text.toLowerCase()
  for (const tag of allTags) {
    if (lowerText.includes(tag.name.toLowerCase()) && !tagIds.includes(tag.id)) {
      tagIds.push(tag.id)
      if (tagIds.length >= 5) break // 最多推荐 5 个标签
    }
  }

  return { tagIds, categoryId }
}

