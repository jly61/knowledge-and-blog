import { NoteEditor } from "@/components/notes/note-editor"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function NewNotePage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const [categories, tags, allNotes] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
    }),
    db.note.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
      },
    }),
  ])

  const noteTitleMap = new Map<string, string>()
  allNotes.forEach((n) => {
    noteTitleMap.set(n.title.toLowerCase(), n.id)
    noteTitleMap.set(n.title, n.id)
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">新建笔记</h1>
      <NoteEditor categories={categories} tags={tags} noteTitleMap={noteTitleMap} />
    </div>
  )
}

