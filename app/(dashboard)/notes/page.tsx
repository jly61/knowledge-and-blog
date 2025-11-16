import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"
import { NoteCard } from "@/components/notes/note-card"

export default async function NotesPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const notes = await db.note.findMany({
    where: { userId: user.id },
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
    orderBy: [
      { isPinned: "desc" },
      { updatedAt: "desc" },
    ],
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的笔记</h1>
          <p className="text-muted-foreground">
            共 {notes.length} 篇笔记
          </p>
        </div>
        <Link href="/notes/new">
          <Button>新建笔记</Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">还没有创建任何笔记</p>
            <Link href="/notes/new">
              <Button>创建第一篇笔记</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}

