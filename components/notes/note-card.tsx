import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { NoteForList } from "@/types/note"
import { Pin, Heart, Link2 } from "lucide-react"

interface NoteCardProps {
  note: NoteForList
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/notes/${note.id}`}>
              <CardTitle className="hover:text-primary transition-colors flex items-center gap-2">
                {note.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
                {note.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-red-500" />}
                {note.title}
              </CardTitle>
            </Link>
            {note.excerpt && (
              <CardDescription className="mt-2 line-clamp-2">
                {note.excerpt}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {note.category && (
              <span className="px-2 py-1 bg-secondary rounded text-xs">
                {note.category.name}
              </span>
            )}
            {note.tags.length > 0 && (
              <div className="flex gap-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-secondary rounded text-xs"
                  >
                    #{tag.name}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-xs">+{note.tags.length - 3}</span>
                )}
              </div>
            )}
            <span>{formatRelativeTime(note.updatedAt)}</span>
            {(note._count?.links || 0) > 0 && (
              <span className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                {note._count?.links || 0}
              </span>
            )}
          </div>
          <Link href={`/notes/${note.id}`}>
            <Button variant="ghost" size="sm">
              查看 →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

