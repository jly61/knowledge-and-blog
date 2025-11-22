"use client"

import { useState } from "react"
import { TiptapEditor } from "./tiptap-editor"
import { NoteContent } from "@/components/notes/note-content"
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown/convert"
import { ImageUploadButton } from "@/components/upload/image-upload-button"
import { Button } from "@/components/ui/button"
import { Edit, Eye, Columns2 } from "lucide-react"

interface MarkdownEditorWithPreviewProps {
  content: string
  onChange: (content: string) => void
  noteTitleMap?: Map<string, string>
  placeholder?: string
}

type ViewMode = "edit" | "preview" | "split"

export function MarkdownEditorWithPreview({
  content,
  onChange,
  noteTitleMap = new Map(),
  placeholder = "开始输入...",
}: MarkdownEditorWithPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit")
  const [htmlContent, setHtmlContent] = useState(() => {
    // 初始内容：如果是 Markdown，转换为 HTML
    if (!content) return ""
    try {
      return markdownToHtml(content)
    } catch {
      return content
    }
  })

  const handleEditorChange = (html: string) => {
    setHtmlContent(html)
    // 将 HTML 转换回 Markdown 并通知父组件
    const markdown = htmlToMarkdown(html)
    onChange(markdown)
  }

  const handleImageUpload = (url: string) => {
    // 在 HTML 内容中插入图片
    const imageHtml = `<img src="${url}" alt="图片" />`
    const newHtml = htmlContent + "\n" + imageHtml
    setHtmlContent(newHtml)
    // 将 HTML 转换回 Markdown 并通知父组件
    const markdown = htmlToMarkdown(newHtml)
    onChange(markdown)
  }

  // 将 HTML 转换回 Markdown 用于预览
  const markdownContent = htmlContent ? htmlToMarkdown(htmlContent) : ""

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={viewMode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          <Button
            type="button"
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            预览
          </Button>
          <Button
            type="button"
            variant={viewMode === "split" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("split")}
          >
            <Columns2 className="w-4 h-4 mr-2" />
            分屏
          </Button>
        </div>
        <ImageUploadButton
          onUploadComplete={handleImageUpload}
          variant="outline"
          size="sm"
        />
      </div>

      {viewMode === "edit" && (
        <TiptapEditor
          content={htmlContent}
          onChange={handleEditorChange}
          placeholder={placeholder}
          editable={true}
        />
      )}

      {viewMode === "preview" && (
        <div className="border rounded-lg p-6 min-h-[300px]">
          <NoteContent content={markdownContent} noteTitleMap={noteTitleMap} />
        </div>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <TiptapEditor
              content={htmlContent}
              onChange={handleEditorChange}
              placeholder={placeholder}
              editable={true}
            />
          </div>
          <div className="border rounded-lg p-6 min-h-[300px] overflow-auto">
            <NoteContent content={markdownContent} noteTitleMap={noteTitleMap} />
          </div>
        </div>
      )}
    </div>
  )
}

