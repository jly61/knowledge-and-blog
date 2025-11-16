import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NoteView } from "@/components/notes/note-view"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function NoteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const note = await db.note.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      tags: true,
      links: {
        include: {
          toNote: {
            select: {
              id: true,
              title: true,
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
            },
          },
        },
      },
    },
  })

  if (!note || note.userId !== user.id) {
    redirect("/notes")
  }

  // 获取所有笔记的标题映射，用于双向链接解析
  const allNotes = await db.note.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
    },
  })

  const noteTitleMap = new Map<string, string>()
  allNotes.forEach((n: { id: string; title: string }) => {
    // 支持精确匹配和大小写不敏感匹配
    noteTitleMap.set(n.title.toLowerCase(), n.id)
    noteTitleMap.set(n.title, n.id)
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{note.title}</h1>
        <div className="flex gap-2">
          <Link href={`/notes/${note.id}/edit`}>
            <Button variant="outline">编辑</Button>
          </Link>
        </div>
      </div>
      <NoteView note={note} noteTitleMap={noteTitleMap} />
    </div>
  )
}

