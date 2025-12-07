"use client"

/**
 * Markdown 分屏编辑器
 *
 * 左侧显示 Markdown 源码（带工具栏），右侧实时预览
 * 支持同步滚动和 AI 链接建议
 */

import { NoteContent } from "@/components/notes/note-content"
import { ImageUploadButton } from "@/components/upload/image-upload-button"
import { useEffect, useRef, useState } from "react"
import { AILinkSuggestions } from "./ai-link-suggestions"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownToolbar } from "./markdown-toolbar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"

interface TiptapSplitEditorProps {
  /** Markdown 格式的内容 */
  content: string
  /** 内容变化回调（返回 Markdown 格式） */
  onChange: (content: string) => void
  /** 笔记标题映射（用于双向链接） */
  noteTitleMap?: Map<string, string>
  /** 占位符 */
  placeholder?: string
  /** 当前笔记 ID（用于链接建议） */
  currentNoteId?: string
  /** 是否启用 AI 链接建议 */
  enableLinkSuggestions?: boolean
}

export function TiptapSplitEditor({
  content,
  onChange,
  noteTitleMap = new Map(),
  placeholder = "开始输入 Markdown...",
  currentNoteId,
  enableLinkSuggestions = true,
}: TiptapSplitEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [aiLinkSuggestionsEnabled, setAiLinkSuggestionsEnabled] = useState(enableLinkSuggestions)

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

  // 跟踪光标位置
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.target.selectionStart)
    onChange(e.target.value)
  }

  // 跟踪光标移动
  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setCursorPosition(target.selectionStart)
  }

  // 插入链接
  const handleInsertLink = (noteTitle: string) => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const textBefore = content.substring(0, start)
    const textAfter = content.substring(end)

    // 检查光标前是否有 `[[`
    const beforeCursor = textBefore.slice(-2)
    let linkText = `[[${noteTitle}]]`
    let insertPosition = start

    // 如果光标前有 `[[`，只插入笔记标题和 `]]`
    if (beforeCursor === "[[" || beforeCursor.startsWith("[[")) {
      linkText = `${noteTitle}]]`
      // 找到 `[[` 的位置
      const lastBracketIndex = textBefore.lastIndexOf("[[")
      if (lastBracketIndex !== -1) {
        insertPosition = lastBracketIndex + 2
        const newTextBefore = textBefore.slice(0, lastBracketIndex + 2)
        const newContent = newTextBefore + linkText + textAfter
        onChange(newContent)
        
        setTimeout(() => {
          textarea.focus()
          const newCursorPos = insertPosition + linkText.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          setCursorPosition(newCursorPos)
        }, 0)
        return
      }
    }

    // 正常插入链接
    const newContent = textBefore + linkText + textAfter
    onChange(newContent)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + linkText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      setCursorPosition(newCursorPos)
    }, 0)
  }

  // 处理图片上传
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
      setCursorPosition(newCursorPos)
    }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="ai-link-suggestions"
            checked={aiLinkSuggestionsEnabled}
            onCheckedChange={setAiLinkSuggestionsEnabled}
          />
          <Label
            htmlFor="ai-link-suggestions"
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4" />
            AI 链接建议
          </Label>
        </div>
        <ImageUploadButton
          onUploadComplete={handleImageUpload}
          variant="outline"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-0 border rounded-lg overflow-hidden h-[700px]">
        {/* 左侧：Markdown 源码编辑器（带工具栏） */}
        <div className="relative border-r overflow-hidden flex flex-col">
          <MarkdownToolbar
            textareaRef={editorRef}
            content={content}
            onContentChange={onChange}
            onCursorChange={setCursorPosition}
          />
          <Textarea
            ref={editorRef}
            value={content}
            onChange={handleTextareaChange}
            onSelect={handleTextareaSelect}
            onScroll={handleEditorScroll}
            placeholder={placeholder}
            className="flex-1 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {aiLinkSuggestionsEnabled && (
            <AILinkSuggestions
              content={content}
              currentNoteId={currentNoteId}
              cursorPosition={cursorPosition}
              onInsertLink={handleInsertLink}
            />
          )}
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

