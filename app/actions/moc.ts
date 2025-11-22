"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

/**
 * 获取所有 MOC 笔记
 */
export async function getMOCNotes() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const mocNotes = await db.note.findMany({
    where: {
      userId: user.id,
      isMOC: true,
    },
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
    orderBy: {
      updatedAt: "desc",
    },
  })

  return mocNotes
}

/**
 * 切换笔记的 MOC 状态
 */
export async function toggleMOCStatus(noteId: string, isMOC: boolean) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  // 验证笔记所有权
  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { userId: true },
  })

  if (!note || note.userId !== user.id) {
    throw new Error("无权操作此笔记")
  }

  await db.note.update({
    where: { id: noteId },
    data: { isMOC },
  })

  revalidatePath("/notes")
  revalidatePath("/moc")
  revalidatePath(`/notes/${noteId}`)
}

/**
 * 获取 MOC 笔记及其关联的笔记
 */
export async function getMOCNoteWithLinks(noteId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const note = await db.note.findUnique({
    where: {
      id: noteId,
      userId: user.id,
      isMOC: true,
    },
    include: {
      category: true,
      tags: true,
      links: {
        include: {
          toNote: {
            select: {
              id: true,
              title: true,
              excerpt: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              tags: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      backlinks: {
        include: {
          fromNote: {
            select: {
              id: true,
              title: true,
              excerpt: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              tags: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  return note
}

