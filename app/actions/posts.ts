"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { generateSlug } from "@/lib/utils"
import { revalidatePath } from "next/cache"

/**
 * 从笔记发布为文章
 */
export async function publishNoteAsPost(
  noteId: string,
  options?: {
    metaTitle?: string
    metaDescription?: string
    categoryId?: string
    tagIds?: string[]
    coverImage?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const note = await db.note.findUnique({
    where: { id: noteId, userId: user.id },
    include: {
      category: true,
      tags: true,
    },
  })

  if (!note) {
    throw new Error("笔记不存在")
  }

  // 检查是否已发布
  if (note.postId) {
    // 更新现有文章
    const existingPost = await db.post.findUnique({
      where: { id: note.postId },
      select: { slug: true },
    })

    // 如果 slug 为空，生成新的 slug
    let slug = existingPost?.slug
    if (!slug || slug.trim() === "") {
      slug = generateSlug(note.title)
      // 检查 slug 是否已存在
      const existingPostWithSlug = await db.post.findUnique({
        where: { slug },
      })
      if (existingPostWithSlug && existingPostWithSlug.id !== note.postId) {
        slug = `${slug}-${Date.now()}`
      }
    }

    const post = await db.post.update({
      where: { id: note.postId },
      data: {
        title: note.title,
        content: note.content,
        excerpt: options?.metaDescription || note.excerpt || extractExcerpt(note.content),
        slug, // 确保 slug 不为空
        metaTitle: options?.metaTitle || note.title,
        metaDescription: options?.metaDescription || note.excerpt || extractExcerpt(note.content),
        coverImage: options?.coverImage,
        published: true,
        publishedAt: new Date(),
        categoryId: options?.categoryId || note.categoryId,
        tags: options?.tagIds
          ? {
              set: options.tagIds.map((id) => ({ id })),
            }
          : note.tags.length > 0
            ? {
                set: note.tags.map((tag) => ({ id: tag.id })),
              }
            : undefined,
      },
    })
    revalidatePath("/blog")
    revalidatePath(`/blog/${post.slug}`)
    return post
  }

  // 创建新文章
  const slug = generateSlug(note.title)
  
  // 检查 slug 是否已存在
  const existingPost = await db.post.findUnique({
    where: { slug },
  })

  let finalSlug = slug
  if (existingPost) {
    // 如果 slug 已存在，添加时间戳
    finalSlug = `${slug}-${Date.now()}`
  }

  const post = await db.post.create({
    data: {
      title: note.title,
      content: note.content,
      excerpt: options?.metaDescription || note.excerpt || extractExcerpt(note.content),
      slug: finalSlug,
      metaTitle: options?.metaTitle || note.title,
      metaDescription: options?.metaDescription || note.excerpt || extractExcerpt(note.content),
      coverImage: options?.coverImage,
      published: true,
      publishedAt: new Date(),
      userId: user.id,
      noteId: note.id,
      categoryId: options?.categoryId || note.categoryId,
      tags: options?.tagIds
        ? {
            connect: options.tagIds.map((id) => ({ id })),
          }
        : note.tags.length > 0
          ? {
              connect: note.tags.map((tag) => ({ id: tag.id })),
            }
          : undefined,
    },
  })

  // 更新笔记关联
  await db.note.update({
    where: { id: noteId },
    data: { postId: post.id },
  })

  revalidatePath("/blog")
  revalidatePath(`/blog/${post.slug}`)
  return post
}

/**
 * 更新文章
 */
export async function updatePost(
  postId: string,
  data: {
    title?: string
    content?: string
    excerpt?: string
    metaTitle?: string
    metaDescription?: string
    categoryId?: string
    tagIds?: string[]
    coverImage?: string
    published?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const post = await db.post.findUnique({
    where: { id: postId, userId: user.id },
  })

  if (!post) {
    throw new Error("文章不存在")
  }

  const updateData: any = {}

  if (data.title !== undefined) {
    updateData.title = data.title
    // 如果标题改变，更新 slug
    if (data.title !== post.title) {
      const newSlug = generateSlug(data.title)
      const existingPost = await db.post.findUnique({
        where: { slug: newSlug },
      })
      updateData.slug = existingPost ? `${newSlug}-${Date.now()}` : newSlug
    }
  }

  if (data.content !== undefined) updateData.content = data.content
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
  if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
  if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null

  if (data.tagIds !== undefined) {
    updateData.tags = {
      set: data.tagIds.map((id) => ({ id })),
    }
  }

  if (data.published !== undefined) {
    updateData.published = data.published
    if (data.published && !post.publishedAt) {
      updateData.publishedAt = new Date()
    }
  }

  const updated = await db.post.update({
    where: { id: postId },
    data: updateData,
  })

  revalidatePath("/blog")
  revalidatePath(`/blog/${updated.slug}`)
  if (post.slug !== updated.slug) {
    revalidatePath(`/blog/${post.slug}`)
  }

  return updated
}

/**
 * 删除文章
 */
export async function deletePost(postId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const post = await db.post.findUnique({
    where: { id: postId, userId: user.id },
    select: {
      id: true,
      slug: true,
      noteId: true,
    },
  })

  if (!post) {
    throw new Error("文章不存在")
  }

  const postSlug = post.slug
  const noteId = post.noteId

  // 如果文章关联了笔记，先清除笔记的 postId（必须在删除 Post 之前，避免外键约束错误）
  if (noteId) {
    await db.note.update({
      where: { id: noteId },
      data: { postId: null },
    })
  }

  // 删除文章（Prisma 会自动处理关联的 comments、tags 等）
  // comments 有 onDelete: Cascade，会自动删除
  // tags 是多对多关系，会自动断开
  // category 有 onDelete: SetNull，会自动处理
  await db.post.delete({
    where: { id: postId },
  })

  // 清除所有相关缓存
  revalidatePath("/blog")
  if (postSlug) {
    revalidatePath(`/blog/${postSlug}`)
  }
  if (noteId) {
    revalidatePath("/notes")
  }
}

/**
 * 获取文章详情（公开）
 */
export async function getPostBySlug(slug: string) {
  const post = await db.post.findUnique({
    where: { slug, published: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      category: true,
      tags: true,
      note: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!post) {
    return null
  }

  // 增加阅读量
  await db.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  })

  return post
}

/**
 * 获取文章详情（用于编辑，需要权限检查）
 */
export async function getPostForEdit(postId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const post = await db.post.findUnique({
    where: { id: postId, userId: user.id },
    include: {
      category: true,
      tags: true,
    },
  })

  if (!post) {
    return null
  }

  return post
}

/**
 * 根据 slug 获取文章（用于编辑，需要权限检查）
 */
export async function getPostBySlugForEdit(slug: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const post = await db.post.findUnique({
    where: { slug, userId: user.id },
    include: {
      category: true,
      tags: true,
    },
  })

  if (!post) {
    return null
  }

  return post
}

/**
 * 获取用户的所有文章（包括未发布的）
 */
export async function getUserPosts() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const posts = await db.post.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      tags: true,
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return posts
}

/**
 * 提取摘要
 */
function extractExcerpt(content: string, maxLength: number = 200): string {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // 链接
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // 双向链接
    .replace(/#{1,6}\s+/g, "") // 标题
    .replace(/\*\*([^\*]+)\*\*/g, "$1") // 加粗
    .replace(/\*([^\*]+)\*/g, "$1") // 斜体
    .replace(/`([^`]+)`/g, "$1") // 行内代码
    .replace(/```[\s\S]*?```/g, "") // 代码块
    .replace(/>\s+/g, "") // 引用
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  return plainText.slice(0, maxLength) + "..."
}

