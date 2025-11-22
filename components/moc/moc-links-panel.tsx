"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowRight } from "lucide-react"

interface MOCLinksPanelProps {
  links: Array<{
    id: string
    toNote: {
      id: string
      title: string
      excerpt: string | null
      category: {
        id: string
        name: string
        color: string | null
      } | null
      tags: Array<{
        id: string
        name: string
        color: string | null
      }>
    }
  }>
  backlinks: Array<{
    id: string
    fromNote: {
      id: string
      title: string
      excerpt: string | null
      category: {
        id: string
        name: string
        color: string | null
      } | null
      tags: Array<{
        id: string
        name: string
        color: string | null
      }>
    }
  }>
}

export function MOCLinksPanel({ links, backlinks }: MOCLinksPanelProps) {
  const allNotes = [
    ...links.map((link) => ({ ...link.toNote, linkId: link.id })),
    ...backlinks.map((backlink) => ({ ...backlink.fromNote, linkId: backlink.id })),
  ]

  if (allNotes.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          关联的笔记 ({allNotes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="block p-3 rounded-md border hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium mb-1">{note.title}</div>
                  {note.excerpt && (
                    <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {note.excerpt}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.category && (
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{
                          backgroundColor: note.category.color
                            ? `${note.category.color}20`
                            : undefined,
                          color: note.category.color || undefined,
                        }}
                      >
                        {note.category.name}
                      </span>
                    )}
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

