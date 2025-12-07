"use client"

/**
 * Markdown 工具栏
 *
 * 为 textarea 编辑器提供 Markdown 语法插入功能
 */

import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface MarkdownToolbarProps {
  /** textarea 元素引用 */
  textareaRef: React.RefObject<HTMLTextAreaElement>
  /** 当前内容 */
  content: string
  /** 内容更新回调 */
  onContentChange: (newContent: string) => void
  /** 光标位置更新回调 */
  onCursorChange?: (position: number) => void
}

export function MarkdownToolbar({
  textareaRef,
  content,
  onContentChange,
  onCursorChange,
}: MarkdownToolbarProps) {
  // 在光标位置插入文本
  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textBefore = content.substring(0, start)
    const textAfter = content.substring(end)

    // 如果有选中文本，用标记包裹；否则插入占位符
    const insertText = selectedText || placeholder
    const newContent = textBefore + before + insertText + after + textAfter

    onContentChange(newContent)

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + insertText.length + after.length
      if (selectedText) {
        // 如果有选中文本，选中整个插入的内容
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + insertText.length
        )
      } else {
        // 如果没有选中文本，光标放在占位符中间
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + insertText.length
        )
      }
      onCursorChange?.(textarea.selectionStart)
    }, 0)
  }

  return (
    <div className="border-b p-2 flex flex-wrap items-center gap-1 bg-muted/50">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("**", "**", "加粗文本")}
        title="加粗"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("*", "*", "斜体文本")}
        title="斜体"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("~~", "~~", "删除文本")}
        title="删除线"
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("`", "`", "代码")}
        title="行内代码"
      >
        <Code className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = line.trimStart().startsWith("# ") ? line.replace(/^#+\s*/, "") : `# ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="标题 1"
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = line.trimStart().startsWith("## ") ? line.replace(/^#+\s*/, "") : `## ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="标题 2"
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = line.trimStart().startsWith("### ") ? line.replace(/^#+\s*/, "") : `### ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="标题 3"
      >
        <Heading3 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = line.trimStart().startsWith("- ") ? line.replace(/^-\s*/, "") : `- ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="无序列表"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = /^\d+\.\s/.test(line.trimStart()) ? line.replace(/^\d+\.\s*/, "") : `1. ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="有序列表"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return
          const start = textarea.selectionStart
          const lineStart = content.lastIndexOf("\n", start - 1) + 1
          const lineEnd = content.indexOf("\n", start)
          const lineEndPos = lineEnd === -1 ? content.length : lineEnd
          const line = content.substring(lineStart, lineEndPos)
          const newLine = line.trimStart().startsWith("> ") ? line.replace(/^>\s*/, "") : `> ${line.trimStart()}`
          const newContent = content.substring(0, lineStart) + newLine + content.substring(lineEndPos)
          onContentChange(newContent)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start)
            onCursorChange?.(textarea.selectionStart)
          }, 0)
        }}
        title="引用"
      >
        <Quote className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("[", "](url)", "链接文本")}
        title="链接"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => insertText("![", "](url)", "图片描述")}
        title="图片"
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}

