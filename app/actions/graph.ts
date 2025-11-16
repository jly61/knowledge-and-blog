"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"

export interface GraphNode {
  id: string
  label: string
  title: string
  color?: string
  category?: string
  tags?: string[]
  size?: number
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  arrows: string
  value?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * 获取知识图谱数据
 */
export async function getGraphData(options?: {
  categoryId?: string
  tagIds?: string[]
}): Promise<GraphData> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  // 构建查询条件
  const where: any = {
    userId: user.id,
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId
  }

  if (options?.tagIds && options.tagIds.length > 0) {
    where.tags = {
      some: {
        id: {
          in: options.tagIds,
        },
      },
    }
  }

  // 获取所有笔记及其链接关系
  const notes = await db.note.findMany({
    where,
    include: {
      category: true,
      tags: true,
      links: {
        include: {
          toNote: {
            select: {
              id: true,
              title: true,
              category: true,
              tags: true,
            },
          },
        },
      },
      backlinks: {
        include: {
          fromNote: {
            select: {
              id: true,
              title: true,
              category: true,
              tags: true,
            },
          },
        },
      },
    },
  })

  // 生成节点
  const nodeMap = new Map<string, GraphNode>()
  const edgeSet = new Set<string>()

  notes.forEach((note) => {
    // 计算节点大小（基于链接数量）
    const linkCount = note.links.length + note.backlinks.length
    const size = Math.max(20, Math.min(50, 20 + linkCount * 2))

    // 确定节点颜色
    let color = "#3b82f6" // 默认蓝色
    if (note.category?.color) {
      color = note.category.color
    } else if (note.tags.length > 0 && note.tags[0].color) {
      color = note.tags[0].color
    }

    nodeMap.set(note.id, {
      id: note.id,
      label: note.title,
      title: note.title,
      color,
      category: note.category?.name,
      tags: note.tags.map((tag) => tag.name),
      size,
    })

    // 生成边（从当前笔记到链接的笔记）
    note.links.forEach((link) => {
      const edgeKey = `${note.id}-${link.toNote.id}`
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
      }
    })
  })

  // 生成边数据
  const edges: GraphEdge[] = []
  const processedEdges = new Set<string>()
  
  notes.forEach((note) => {
    note.links.forEach((link) => {
      const edgeKey = `${note.id}-${link.toNote.id}`
      // 确保目标节点存在（可能因为筛选条件被过滤）
      if (nodeMap.has(link.toNote.id) && !processedEdges.has(edgeKey)) {
        edges.push({
          id: `edge-${link.id}`,
          from: note.id,
          to: link.toNote.id,
          arrows: "to",
          value: 1,
        })
        processedEdges.add(edgeKey)
      }
    })
  })

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  }
}

/**
 * 获取所有分类（用于筛选）
 */
export async function getCategoriesForGraph() {
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
 * 获取所有标签（用于筛选）
 */
export async function getTagsForGraph() {
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

