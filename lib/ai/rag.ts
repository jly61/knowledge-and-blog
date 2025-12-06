/**
 * RAG (Retrieval Augmented Generation) 检索逻辑
 * 
 * 实现基于向量相似度的笔记检索功能
 */

import { db } from "@/lib/db"
import { generateEmbedding } from "./embeddings"

/**
 * 检索相关笔记
 * 
 * @param query - 查询文本
 * @param userId - 用户 ID（只检索该用户的笔记）
 * @param limit - 返回结果数量限制，默认 5
 * @param threshold - 相似度阈值（0-1），默认 0.7
 * @returns 相关笔记列表，按相似度排序
 */
export async function retrieveRelevantNotes(
  query: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.7
) {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query)

    // 使用 PostgreSQL 的向量相似度搜索
    // 使用余弦相似度：1 - (embedding <=> query_embedding)
    // 注意：需要将向量数组转换为 PostgreSQL 的 vector 类型字符串格式
    const embeddingStr = `[${queryEmbedding.join(",")}]`
    
    const results = await db.$queryRawUnsafe<Array<{
      id: string
      title: string
      content: string
      excerpt: string | null
      similarity: number
    }>>(
      `SELECT 
        id,
        title,
        content,
        excerpt,
        1 - (embedding <=> $1::vector) as similarity
      FROM "Note"
      WHERE 
        "userId" = $2
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) >= $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4`,
      embeddingStr,
      userId,
      threshold,
      limit
    )

    return results.map((note) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      excerpt: note.excerpt,
      similarity: Number(note.similarity),
    }))
  } catch (error) {
    console.error("RAG retrieval error:", error)
    // 如果向量搜索失败，返回空数组
    return []
  }
}

/**
 * 构建 RAG 上下文提示
 * 
 * @param query - 用户查询
 * @param relevantNotes - 相关笔记列表
 * @returns 包含上下文的提示文本
 */
export function buildRAGContext(query: string, relevantNotes: Array<{
  id: string
  title: string
  content: string
  excerpt: string | null
  similarity: number
}>): string {
  if (relevantNotes.length === 0) {
    return query
  }

  let context = "基于以下笔记内容回答问题：\n\n"

  relevantNotes.forEach((note, index) => {
    context += `[笔记 ${index + 1}: ${note.title}]\n`
    context += `${note.content}\n\n`
  })

  context += `问题：${query}\n\n`
  context += "请基于上述笔记内容回答问题。如果笔记中没有相关信息，请说明。回答时请引用具体的笔记标题。"

  return context
}

/**
 * 获取当前笔记的上下文（如果提供了 noteId）
 * 
 * @param noteId - 笔记 ID
 * @param userId - 用户 ID
 * @returns 笔记内容，如果不存在则返回 null
 */
export async function getCurrentNoteContext(
  noteId: string | undefined,
  userId: string
) {
  if (!noteId) {
    return null
  }

  try {
    const note = await db.note.findFirst({
      where: {
        id: noteId,
        userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
      },
    })

    return note
  } catch (error) {
    console.error("Get current note context error:", error)
    return null
  }
}

