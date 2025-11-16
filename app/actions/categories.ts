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
 * 创建分类
 */
export async function createCategory(data: {
  name: string
  description?: string
  color?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  if (!data.name.trim()) {
    throw new Error("分类名称不能为空")
  }

  const slug = generateSlug(data.name)

  // 检查 slug 是否已存在
  const existing = await db.category.findUnique({
    where: { slug },
  })

  if (existing) {
    throw new Error("分类名称已存在")
  }

  const category = await db.category.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description?.trim(),
      color: data.color,
    },
  })

  revalidatePath("/categories")
  revalidatePath("/notes")
  return category
}

/**
 * 更新分类
 */
export async function updateCategory(
  categoryId: string,
  data: {
    name?: string
    description?: string
    color?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    throw new Error("分类不存在")
  }

  const updateData: any = {}
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error("分类名称不能为空")
    }
    const slug = generateSlug(data.name)
    
    // 检查 slug 是否已被其他分类使用
    const existing = await db.category.findUnique({
      where: { slug },
    })
    
    if (existing && existing.id !== categoryId) {
      throw new Error("分类名称已存在")
    }
    
    updateData.name = data.name.trim()
    updateData.slug = slug
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null
  }
  if (data.color !== undefined) {
    updateData.color = data.color || null
  }

  const updated = await db.category.update({
    where: { id: categoryId },
    data: updateData,
  })

  revalidatePath("/categories")
  revalidatePath("/notes")
  return updated
}

/**
 * 删除分类
 */
export async function deleteCategory(categoryId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      notes: {
        select: { id: true },
        take: 1,
      },
      posts: {
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!category) {
    throw new Error("分类不存在")
  }

  // 检查是否有笔记或文章使用此分类
  if (category.notes.length > 0 || category.posts.length > 0) {
    throw new Error("无法删除：该分类下还有笔记或文章，请先移除关联")
  }

  await db.category.delete({
    where: { id: categoryId },
  })

  revalidatePath("/categories")
  revalidatePath("/notes")
}

/**
 * 获取所有分类（带统计信息）
 */
export async function getCategoriesWithStats() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  })

  // 获取每个分类的统计信息
  const categoriesWithStats = await Promise.all(
    categories.map(async (category) => {
      const [notesCount, postsCount] = await Promise.all([
        db.note.count({
          where: {
            categoryId: category.id,
            userId: user.id,
          },
        }),
        db.post.count({
          where: {
            categoryId: category.id,
            userId: user.id,
          },
        }),
      ])

      return {
        ...category,
        _count: {
          notes: notesCount,
          posts: postsCount,
        },
      }
    })
  )

  return categoriesWithStats
}

