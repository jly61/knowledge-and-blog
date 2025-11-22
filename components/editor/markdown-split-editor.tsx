"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { NoteContent } from "@/components/notes/note-content"
import { ImageUploadButton } from "@/components/upload/image-upload-button"
import { Button } from "@/components/ui/button"

interface MarkdownSplitEditorProps {
  content: string
  onChange: (content: string) => void
  noteTitleMap?: Map<string, string>
  placeholder?: string
}

export function MarkdownSplitEditor({
  content,
  onChange,
  noteTitleMap = new Map(),
  placeholder = "开始输入 Markdown...",
}: MarkdownSplitEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // 同步滚动处理
  const handleEditorScroll = () => {
    if (isScrolling) return

    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    setIsScrolling(true)

    // 计算滚动比例
    const editorMaxScroll = editor.scrollHeight - editor.clientHeight
    const previewMaxScroll = preview.scrollHeight - preview.clientHeight

    if (editorMaxScroll > 0 && previewMaxScroll > 0) {
      const scrollRatio = editor.scrollTop / editorMaxScroll
      preview.scrollTop = scrollRatio * previewMaxScroll
    }

    setTimeout(() => setIsScrolling(false), 50)
  }

  const handlePreviewScroll = () => {
    if (isScrolling) return

    const editor = editorRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    setIsScrolling(true)

    // 计算滚动比例
    const editorMaxScroll = editor.scrollHeight - editor.clientHeight
    const previewMaxScroll = preview.scrollHeight - preview.clientHeight

    if (editorMaxScroll > 0 && previewMaxScroll > 0) {
      const scrollRatio = preview.scrollTop / previewMaxScroll
      editor.scrollTop = scrollRatio * editorMaxScroll
    }

    setTimeout(() => setIsScrolling(false), 50)
  }

  const handleImageUpload = (url: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    // 获取光标位置
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const textBefore = content.substring(0, start)
    const textAfter = content.substring(end)

    // 插入 Markdown 图片语法
    const imageMarkdown = `![图片](${url})`
    const newContent = textBefore + imageMarkdown + textAfter

    onChange(newContent)

    // 设置光标位置到插入内容之后
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + imageMarkdown.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ImageUploadButton
          onUploadComplete={handleImageUpload}
          variant="outline"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden h-[700px]">
        {/* 左侧：Markdown 编辑器 */}
        <div className="relative border-r overflow-hidden">
          <Textarea
            ref={editorRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleEditorScroll}
            placeholder={placeholder}
            className="h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* 右侧：预览 */}
        <div
          ref={previewRef}
          onScroll={handlePreviewScroll}
          className="overflow-auto p-6 h-full bg-muted/30"
        >
          {content.trim() ? (
            <NoteContent content={content} noteTitleMap={noteTitleMap} />
          ) : (
            <div className="text-muted-foreground text-center py-12">
              <p>预览将在这里显示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

