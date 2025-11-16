"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotePreview } from "@/app/actions/notes"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"
import { Loader2 } from "lucide-react"

interface LinkPreviewProps {
  noteId: string
  children: React.ReactNode
}

interface NotePreviewData {
  id: string
  title: string
  preview: string
  category: { id: string; name: string } | null
  tags: Array<{ id: string; name: string }>
  updatedAt: Date
  _count: {
    links: number
    backlinks: number
  }
}

export function LinkPreview({ noteId, children }: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<NotePreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && !previewData && !isLoading) {
      // 延迟加载，避免快速悬停时立即请求
      const timer = setTimeout(() => {
        setIsLoading(true)
        getNotePreview(noteId)
          .then((data) => {
            if (data) {
              setPreviewData(data)
            }
          })
          .catch((error) => {
            console.error("获取笔记预览失败:", error)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }, 300) // 300ms 延迟

      return () => clearTimeout(timer)
    }
  }, [isOpen, noteId, previewData, isLoading])

  const handleMouseEnter = () => {
    // 清除可能存在的关闭定时器
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      setHoverTimer(null)
    }
    // 延迟打开，避免鼠标快速划过时打开
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 200)
    setHoverTimer(timer)
  }

  const handleMouseLeave = () => {
    // 清除打开定时器
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      setHoverTimer(null)
    }
    // 延迟关闭，给用户时间移动到预览卡片
    const timer = setTimeout(() => {
      setIsOpen(false)
    }, 200)
    setHoverTimer(timer)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
      </span>
      <PopoverContent
        className="w-80 p-0"
        side="right"
        align="start"
        sideOffset={8}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : previewData ? (
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <Link
                href={`/notes/${previewData.id}`}
                onClick={() => setIsOpen(false)}
                className="hover:underline"
              >
                <CardTitle className="text-base leading-tight">
                  {previewData.title}
                </CardTitle>
              </Link>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-2">
                {previewData.category && (
                  <span className="px-2 py-0.5 bg-secondary rounded">
                    {previewData.category.name}
                  </span>
                )}
                {previewData.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 bg-secondary rounded"
                  >
                    #{tag.name}
                  </span>
                ))}
                <span>{formatRelativeTime(previewData.updatedAt)}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-4">
                {previewData.preview}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                <span>{previewData._count.links} 个链接</span>
                <span>{previewData._count.backlinks} 个反向链接</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            无法加载预览
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

