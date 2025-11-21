"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { parseLinks } from "@/lib/markdown/parseLinks"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * 创建笔记
 */
export async function createNote(data: {
  title: string
  content: string
  categoryId?: string
  tagIds?: string[]
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  // 创建笔记
  const note = await db.note.create({
    data: {
      title: data.title,
      content: data.content,
      userId: user.id,
      categoryId: data.categoryId,
      tags: data.tagIds && data.tagIds.length > 0
        ? {
            connect: data.tagIds.map((id) => ({ id })),
          }
        : undefined,
    },
  })

  // 解析并创建链接关系
  await updateNoteLinks(note.id, data.content)

  revalidatePath("/notes")
  return note
}

/**
 * 更新笔记
 */
export async function updateNote(
  noteId: string,
  data: {
    title?: string
    content?: string
    categoryId?: string
    tagIds?: string[]
    isPinned?: boolean
    isFavorite?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  // 检查权限
  const note = await db.note.findUnique({
    where: { id: noteId },
  })

  if (!note || note.userId !== user.id) {
    throw new Error("笔记不存在或无权访问")
  }

  // 更新笔记
  const updatedNote = await db.note.update({
    where: { id: noteId },
    data: {
      title: data.title,
      content: data.content,
      categoryId: data.categoryId,
      isPinned: data.isPinned,
      isFavorite: data.isFavorite,
      tags: data.tagIds
        ? {
            set: data.tagIds.map((id) => ({ id })),
          }
        : undefined,
    },
  })

  // 如果内容更新了，更新链接关系
  if (data.content !== undefined) {
    await updateNoteLinks(noteId, data.content)
  }

  revalidatePath("/notes")
  revalidatePath(`/notes/${noteId}`)
  return updatedNote
}

/**
 * 删除笔记
 */
export async function deleteNote(noteId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  // 检查权限
  const note = await db.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      userId: true,
      postId: true,
    },
  })

  if (!note || note.userId !== user.id) {
    throw new Error("笔记不存在或无权访问")
  }

  // 如果笔记已发布为文章，先删除关联的文章
  if (note.postId) {
    await db.post.delete({
      where: { id: note.postId },
    })
    revalidatePath("/blog")
  }

  // 删除笔记
  await db.note.delete({
    where: { id: noteId },
  })

  revalidatePath("/notes")
  redirect("/notes")
}

/**
 * 根据 ID 获取笔记详情
 */
export async function getNoteById(noteId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const note = await db.note.findUnique({
    where: { id: noteId },
    include: {
      category: true,
      tags: true,
    },
  })

  if (!note || note.userId !== user.id) {
    return null
  }

  return note
}

/**
 * 获取笔记预览（用于链接预览）
 */
export async function getNotePreview(noteId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      userId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
      updatedAt: true,
      _count: {
        select: {
          links: true,
          backlinks: true,
        },
      },
    },
  })

  if (!note || note.userId !== user.id) {
    return null
  }

  // 生成摘要
  let preview = note.excerpt
  if (!preview) {
    // 如果没有摘要，提取前 200 个字符
    preview = note.content.slice(0, 200)
    if (note.content.length > 200) {
      preview += "..."
    }
  }

  return {
    id: note.id,
    title: note.title,
    preview,
    category: note.category,
    tags: note.tags,
    updatedAt: note.updatedAt,
    _count: note._count,
  }
}

/**
 * 更新笔记的链接关系
 */
async function updateNoteLinks(noteId: string, content: string) {
  const links = parseLinks(content)

  // 删除旧链接
  await db.noteLink.deleteMany({
    where: { fromNoteId: noteId },
  })

  // 创建新链接
  for (const link of links) {
    // 查找目标笔记（模糊匹配标题）
    const targetNote = await db.note.findFirst({
      where: {
        title: {
          contains: link.text,
          mode: "insensitive",
        },
      },
    })

    if (targetNote && targetNote.id !== noteId) {
      await db.noteLink.create({
        data: {
          fromNoteId: noteId,
          toNoteId: targetNote.id,
          context: link.context,
          position: link.start,
        },
      })
    }
  }
}
