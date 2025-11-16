import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Backlink {
  id: string
  fromNote: {
    id: string
    title: string
  }
}

interface BacklinksPanelProps {
  backlinks: Backlink[]
}

export function BacklinksPanel({ backlinks }: BacklinksPanelProps) {
  if (backlinks.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>↩️</span>
          反向链接
          <span className="text-sm font-normal text-muted-foreground">
            ({backlinks.length})
          </span>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          以下笔记链接到了这篇笔记
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {backlinks.map((backlink) => (
            <Link
              key={backlink.id}
              href={`/notes/${backlink.fromNote.id}`}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {backlink.fromNote.title}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

