"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export interface SearchResult {
  id: string
  title: string
  content: string
  excerpt?: string
  category?: {
    id: string
    name: string
  } | null
  tags: Array<{
    id: string
    name: string
  }>
  updatedAt: Date
  _count?: {
    links: number
    backlinks: number
  }
}

export interface SearchOptions {
  query: string
  categoryId?: string
  tagIds?: string[]
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

/**
 * 搜索笔记
 */
export async function searchNotes(options: SearchOptions): Promise<SearchResult[]> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const {
    query,
    categoryId,
    tagIds,
    dateFrom,
    dateTo,
    limit = 50,
  } = options

  // 构建搜索条件
  const where: any = {
    userId: user.id,
  }

  // 文本搜索（标题或内容）
  if (query.trim()) {
    where.OR = [
      {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
    ]
  }

  // 分类筛选
  if (categoryId) {
    where.categoryId = categoryId
  }

  // 标签筛选
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: {
        id: {
          in: tagIds,
        },
      },
    }
  }

  // 日期范围筛选
  if (dateFrom || dateTo) {
    where.updatedAt = {}
    if (dateFrom) {
      where.updatedAt.gte = dateFrom
    }
    if (dateTo) {
      where.updatedAt.lte = dateTo
    }
  }

  // 执行搜索
  const notes = await db.note.findMany({
    where,
    include: {
      category: true,
      tags: true,
      _count: {
        select: {
          links: true,
          backlinks: true,
        },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { updatedAt: "desc" },
    ],
    take: limit,
  })

  // 生成摘要（如果内容中没有 excerpt）
  return notes.map((note) => {
    let excerpt = note.excerpt

    // 如果没有摘要，从内容中提取
    if (!excerpt && query.trim()) {
      // 找到第一个匹配的位置
      const queryLower = query.toLowerCase()
      const contentLower = note.content.toLowerCase()
      const matchIndex = contentLower.indexOf(queryLower)

      if (matchIndex !== -1) {
        // 提取匹配位置前后各 100 个字符
        const start = Math.max(0, matchIndex - 100)
        const end = Math.min(note.content.length, matchIndex + query.length + 100)
        excerpt = note.content.slice(start, end)
        if (start > 0) excerpt = "..." + excerpt
        if (end < note.content.length) excerpt = excerpt + "..."
      } else {
        // 如果没有匹配，提取前 200 个字符
        excerpt = note.content.slice(0, 200)
        if (note.content.length > 200) excerpt += "..."
      }
    } else if (!excerpt) {
      // 没有搜索词时，提取前 200 个字符
      excerpt = note.content.slice(0, 200)
      if (note.content.length > 200) excerpt += "..."
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      excerpt,
      category: note.category,
      tags: note.tags,
      updatedAt: note.updatedAt,
      _count: note._count,
    }
  })
}

/**
 * 获取所有分类（用于搜索筛选）
 */
export async function getCategoriesForSearch() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const categories = await db.category.findMany({
    where: {
      notes: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return categories
}

/**
 * 获取所有标签（用于搜索筛选）
 */
export async function getTagsForSearch() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const tags = await db.tag.findMany({
    where: {
      notes: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return tags
}

