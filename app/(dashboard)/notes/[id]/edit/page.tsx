import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NoteEditor } from "@/components/notes/note-editor"

export default async function EditNotePage({
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
    },
  })

  if (!note || note.userId !== user.id) {
    redirect("/notes")
  }

  const [categories, tags] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">编辑笔记</h1>
      <NoteEditor
        note={note}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}

