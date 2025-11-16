import { NoteWithRelations } from "@/types/note"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { BacklinksPanel } from "@/components/notes/backlinks-panel"
import { NoteContent } from "@/components/notes/note-content"
import { LinkPreview } from "@/components/notes/link-preview"

interface NoteViewProps {
  note: NoteWithRelations & {
    links: Array<{
      id: string
      toNote: { id: string; title: string }
    }>
    backlinks: Array<{
      id: string
      fromNote: { id: string; title: string }
    }>
  }
  noteTitleMap: Map<string, string>
}

export function NoteView({ note, noteTitleMap }: NoteViewProps) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {note.category && (
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium border border-primary/20">
                {note.category.name}
              </span>
            )}
            {note.tags.map((tag: { id: string; name: string }) => (
              <span
                key={tag.id}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full font-medium"
              >
                #{tag.name}
              </span>
            ))}
            <span className="text-muted-foreground ml-auto">
              更新于 {formatDate(note.updatedAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-6">
          <NoteContent content={note.content} noteTitleMap={noteTitleMap} />
        </CardContent>
      </Card>

      {note.links.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>🔗</span>
              链接到的笔记
              <span className="text-sm font-normal text-muted-foreground">
                ({note.links.length})
              </span>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {note.links.map((link: { id: string; toNote: { id: string; title: string } }) => (
                <LinkPreview key={link.id} noteId={link.toNote.id}>
                  <Link href={`/notes/${link.toNote.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {link.toNote.title}
                    </Button>
                  </Link>
                </LinkPreview>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BacklinksPanel backlinks={note.backlinks} />
    </div>
  )
}

