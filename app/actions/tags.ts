"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

/**
 * 生成 slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/[\s_-]+/g, "-") // 将空格、下划线、连字符替换为单个连字符
    .replace(/^-+|-+$/g, "") // 移除开头和结尾的连字符
}

/**
 * 创建标签
 */
export async function createTag(data: {
  name: string
  color?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  if (!data.name.trim()) {
    throw new Error("标签名称不能为空")
  }

  const slug = generateSlug(data.name)

  // 检查 slug 是否已存在
  const existing = await db.tag.findUnique({
    where: { slug },
  })

  if (existing) {
    throw new Error("标签名称已存在")
  }

  const tag = await db.tag.create({
    data: {
      name: data.name.trim(),
      slug,
      color: data.color,
    },
  })

  revalidatePath("/tags")
  revalidatePath("/notes")
  return tag
}

/**
 * 更新标签
 */
export async function updateTag(
  tagId: string,
  data: {
    name?: string
    color?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const tag = await db.tag.findUnique({
    where: { id: tagId },
  })

  if (!tag) {
    throw new Error("标签不存在")
  }

  const updateData: any = {}
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error("标签名称不能为空")
    }
    const slug = generateSlug(data.name)
    
    // 检查 slug 是否已被其他标签使用
    const existing = await db.tag.findUnique({
      where: { slug },
    })
    
    if (existing && existing.id !== tagId) {
      throw new Error("标签名称已存在")
    }
    
    updateData.name = data.name.trim()
    updateData.slug = slug
  }
  if (data.color !== undefined) {
    updateData.color = data.color || null
  }

  const updated = await db.tag.update({
    where: { id: tagId },
    data: updateData,
  })

  revalidatePath("/tags")
  revalidatePath("/notes")
  return updated
}

/**
 * 删除标签
 */
export async function deleteTag(tagId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const tag = await db.tag.findUnique({
    where: { id: tagId },
    include: {
      notes: {
        where: {
          userId: user.id,
        },
        select: { id: true },
        take: 1,
      },
      posts: {
        where: {
          userId: user.id,
        },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!tag) {
    throw new Error("标签不存在")
  }

  // 检查是否有笔记或文章使用此标签
  if (tag.notes.length > 0 || tag.posts.length > 0) {
    throw new Error("无法删除：该标签下还有笔记或文章，请先移除关联")
  }

  await db.tag.delete({
    where: { id: tagId },
  })

  revalidatePath("/tags")
  revalidatePath("/notes")
}

/**
 * 获取所有标签（带统计信息）
 */
export async function getTagsWithStats() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
  })

  // 获取每个标签的统计信息
  const tagsWithStats = await Promise.all(
    tags.map(async (tag) => {
      const [notesCount, postsCount] = await Promise.all([
        db.note.count({
          where: {
            tags: {
              some: {
                id: tag.id,
              },
            },
            userId: user.id,
          },
        }),
        db.post.count({
          where: {
            tags: {
              some: {
                id: tag.id,
              },
            },
            userId: user.id,
          },
        }),
      ])

      return {
        ...tag,
        _count: {
          notes: notesCount,
          posts: postsCount,
        },
      }
    })
  )

  return tagsWithStats
}

