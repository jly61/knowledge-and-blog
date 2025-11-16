import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getNoteById } from "@/app/actions/notes"
import { getCategoriesForGraph, getTagsForGraph } from "@/app/actions/graph"
import { PublishNoteClient } from "@/components/posts/publish-note-client"

export const dynamic = "force-dynamic"

export default async function PublishNotePage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const note = await getNoteById(params.id)
  if (!note || note.userId !== user.id) {
    redirect("/notes")
  }

  const [categories, tags] = await Promise.all([
    getCategoriesForGraph(),
    getTagsForGraph(),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">发布为文章</h1>
        <p className="text-muted-foreground">
          将笔记发布为博客文章，让更多人看到你的内容
        </p>
      </div>

      <PublishNoteClient
        note={note}
        categories={categories}
        tags={tags}
      />
    </div>
  )
}

