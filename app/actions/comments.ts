"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

/**
 * 创建评论
 */
export async function createComment(
  postId: string,
  data: {
    content: string
    authorName: string
    authorEmail?: string
    authorUrl?: string
    parentId?: string
  }
) {
  // 验证必填字段
  if (!data.content.trim() || !data.authorName.trim()) {
    throw new Error("评论内容和作者名称不能为空")
  }

  // 检查文章是否存在
  const post = await db.post.findUnique({
    where: { id: postId, published: true },
  })

  if (!post) {
    throw new Error("文章不存在或未发布")
  }

  // 获取当前用户（如果已登录）
  const user = await getCurrentUser()

  // 创建评论
  const comment = await db.comment.create({
    data: {
      content: data.content.trim(),
      authorName: data.authorName.trim(),
      authorEmail: data.authorEmail?.trim() || null,
      authorUrl: data.authorUrl?.trim() || null,
      postId,
      parentId: data.parentId || null,
      userId: user?.id || null,
      // 所有评论自动审核通过（个人博客系统，可以后续添加审核功能）
      approved: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        where: { approved: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            where: { approved: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  // 确保 replies 字段存在
  const commentWithReplies = {
    ...comment,
    replies: comment.replies || [],
  }

  revalidatePath(`/blog/${post.slug}`)

  return commentWithReplies
}

/**
 * 获取文章的所有评论（已审核的）
 */
export async function getPostComments(postId: string) {
  const comments = await db.comment.findMany({
    where: {
      postId,
      approved: true,
      parentId: null, // 只获取顶级评论
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        where: { approved: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            where: { approved: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // 确保所有评论的 replies 字段都存在
  return comments.map((comment) => ({
    ...comment,
    replies: comment.replies || [],
  }))
}

/**
 * 删除评论（仅作者或管理员）
 */
export async function deleteComment(commentId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        select: {
          slug: true,
        },
      },
    },
  })

  if (!comment) {
    throw new Error("评论不存在")
  }

  // 检查权限：评论作者或文章作者
  const post = await db.post.findUnique({
    where: { id: comment.postId },
    select: { userId: true },
  })

  if (comment.userId !== user.id && post?.userId !== user.id) {
    throw new Error("无权删除此评论")
  }

  await db.comment.delete({
    where: { id: commentId },
  })

  if (comment.post.slug) {
    revalidatePath(`/blog/${comment.post.slug}`)
  }
}

