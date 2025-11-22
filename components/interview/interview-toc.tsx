"use client"

import { Card } from "@/components/ui/card"

interface InterviewTOCProps {
  toc: Array<{ level: number; text: string; id: string }>
}

export function InterviewTOC({ toc }: InterviewTOCProps) {
  if (toc.length === 0) {
    return null
  }

  return (
    <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
      <div className="p-4">
        <h3 className="font-semibold mb-4">目录</h3>
        <nav className="space-y-1">
          {toc.map((item, index) => (
            <a
              key={index}
              href={`#${item.id}`}
              className="block text-sm hover:text-primary transition-colors py-1"
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(item.id)
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </Card>
  )
}

