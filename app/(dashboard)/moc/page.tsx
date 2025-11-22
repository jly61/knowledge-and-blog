import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getMOCNotes } from "@/app/actions/moc"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Link as LinkIcon, Plus } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export default async function MOCPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const mocNotes = await getMOCNotes()

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            MOC (Map of Contents)
          </h1>
          <p className="text-muted-foreground mt-2">
            索引页用于组织和导航你的笔记
          </p>
        </div>
        <Link href="/notes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            创建新笔记
          </Button>
        </Link>
      </div>

      {mocNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">还没有 MOC 笔记</h3>
            <p className="text-muted-foreground mb-4">
              MOC (Map of Contents) 是用于组织和导航笔记的索引页
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                创建笔记后，在编辑页面将其标记为 MOC
              </p>
              <Link href="/notes/new">
                <Button>创建第一个笔记</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mocNotes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {note.title}
                    </CardTitle>
                    <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                      MOC
                    </span>
                  </div>
                  {note.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {note.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <span>{note._count.links + note._count.backlinks}</span>
                    </div>
                    <span>{formatRelativeTime(note.updatedAt)}</span>
                  </div>
                  {note.category && (
                    <div className="mt-2">
                      <span
                        className="inline-block px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: note.category.color
                            ? `${note.category.color}20`
                            : undefined,
                          color: note.category.color || undefined,
                        }}
                      >
                        {note.category.name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

