"use server"

/**
 * AI 双向链接建议 Server Actions
 *
 * 用于根据当前编辑的文本内容，智能推荐可以链接的相关笔记
 */

import { retrieveRelevantNotes } from "@/lib/ai/rag"
import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { parseLinks } from "@/lib/markdown/parseLinks"

/**
 * 链接建议结果接口
 */
export interface LinkSuggestion {
  /** 笔记 ID */
  noteId: string
  /** 笔记标题 */
  title: string
  /** 笔记摘要 */
  excerpt: string | null
  /** 相似度分数（0-1） */
  similarity: number
  /** 推荐理由（可选） */
  reason?: string
}

/**
 * 根据当前编辑的文本内容推荐可链接的笔记
 *
 * @param content - 当前编辑的内容
 * @param currentNoteId - 当前笔记 ID（可选，用于排除自己）
 * @param limit - 返回结果数量限制，默认 5
 * @returns 推荐的笔记列表
 */
export async function suggestLinks(
  content: string,
  currentNoteId?: string,
  limit: number = 5
): Promise<LinkSuggestion[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未授权")
    }

    // 如果内容太短，不推荐
    if (content.trim().length < 10) {
      return []
    }

    // 提取已存在的链接，避免重复推荐
    const existingLinks = parseLinks(content)
    const existingLinkTitles = new Set(
      existingLinks.map((link) => link.text.toLowerCase())
    )

    // 获取当前笔记标题（如果提供了 currentNoteId）
    let currentNoteTitle: string | null = null
    if (currentNoteId) {
      const currentNote = await db.note.findUnique({
        where: { id: currentNoteId },
        select: { title: true },
      })
      currentNoteTitle = currentNote?.title || null
    }

    // 提取最近编辑的文本片段作为查询（取最后 200 个字符）
    const queryText = content.slice(-200).trim()

    // 使用 RAG 检索相关笔记
    // 多取一些结果，用于过滤已存在的链接和当前笔记
    const fetchLimit = Math.min(limit + existingLinks.length + (currentNoteTitle ? 1 : 0), 10)
    const relevantNotes = await retrieveRelevantNotes(
      queryText,
      user.id,
      fetchLimit,
      0.6 // 降低阈值，获取更多建议
    )

    // 过滤结果
    const suggestions: LinkSuggestion[] = []

    for (const note of relevantNotes) {
      // 排除当前笔记
      if (currentNoteId && note.id === currentNoteId) {
        continue
      }

      // 排除已存在的链接
      if (existingLinkTitles.has(note.title.toLowerCase())) {
        continue
      }

      // 排除当前笔记标题（避免自链接）
      if (currentNoteTitle && note.title.toLowerCase() === currentNoteTitle.toLowerCase()) {
        continue
      }

      suggestions.push({
        noteId: note.id,
        title: note.title,
        excerpt: note.excerpt,
        similarity: note.similarity,
      })

      // 达到限制数量就停止
      if (suggestions.length >= limit) {
        break
      }
    }

    return suggestions
  } catch (error) {
    console.error("Link suggestion error:", error)
    // 不抛出错误，返回空数组，避免影响编辑体验
    return []
  }
}

/**
 * 根据特定文本片段推荐链接
 *
 * @param text - 要分析的文本片段
 * @param currentNoteId - 当前笔记 ID（可选）
 * @param limit - 返回结果数量限制，默认 3
 * @returns 推荐的笔记列表
 */
export async function suggestLinksForText(
  text: string,
  currentNoteId?: string,
  limit: number = 3
): Promise<LinkSuggestion[]> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未授权")
    }

    if (text.trim().length < 5) {
      return []
    }

    // 提取已存在的链接
    const existingLinks = parseLinks(text)
    const existingLinkTitles = new Set(
      existingLinks.map((link) => link.text.toLowerCase())
    )

    // 使用 RAG 检索相关笔记
    const relevantNotes = await retrieveRelevantNotes(
      text,
      user.id,
      limit + existingLinks.length + 1,
      0.6
    )

    // 过滤结果
    const suggestions: LinkSuggestion[] = []

    for (const note of relevantNotes) {
      // 排除当前笔记
      if (currentNoteId && note.id === currentNoteId) {
        continue
      }

      // 排除已存在的链接
      if (existingLinkTitles.has(note.title.toLowerCase())) {
        continue
      }

      suggestions.push({
        noteId: note.id,
        title: note.title,
        excerpt: note.excerpt,
        similarity: note.similarity,
      })

      if (suggestions.length >= limit) {
        break
      }
    }

    return suggestions
  } catch (error) {
    console.error("Link suggestion for text error:", error)
    return []
  }
}

