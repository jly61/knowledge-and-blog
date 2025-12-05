import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NoteView } from "@/components/notes/note-view"
import { MOCLinksPanel } from "@/components/moc/moc-links-panel"
import { ChatSidebar } from "@/components/ai/chat-sidebar"
import { Button } from "@/components/ui/button"
import { DeleteNoteButton } from "@/components/notes/delete-note-button"
import Link from "next/link"
import { FileText } from "lucide-react"

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
      post: {
        select: {
          id: true,
          slug: true,
        },
      },
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
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{note.title}</h1>
          {note.isMOC && (
            <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" />
              MOC
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {note.post ? (
            <Link href={`/blog/${note.post.slug}`}>
              <Button variant="outline">查看文章</Button>
            </Link>
          ) : (
            <Link href={`/notes/${note.id}/publish`}>
              <Button>发布为文章</Button>
            </Link>
          )}
          <Link href={`/notes/${note.id}/edit`}>
            <Button variant="outline">编辑</Button>
          </Link>
          <DeleteNoteButton
            noteId={note.id}
            noteTitle={note.title}
            hasPost={!!note.post}
            size="sm"
          />
        </div>
      </div>
      <NoteView note={note} noteTitleMap={noteTitleMap} />
      {note.isMOC && note.links.length + note.backlinks.length > 0 && (
        <div className="mt-6">
          <MOCLinksPanel
            links={note.links as any}
            backlinks={note.backlinks as any}
          />
        </div>
      )}
      <ChatSidebar noteId={note.id} noteTitle={note.title} />
    </div>
  )
}

