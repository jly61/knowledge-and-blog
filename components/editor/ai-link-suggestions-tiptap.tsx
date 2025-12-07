"use client"

/**
 * AI 链接建议组件（Tiptap 版本）
 *
 * 在 Tiptap 编辑器中显示可链接的笔记建议，支持一键插入链接
 */

import { useState, useEffect, useRef } from "react"
import { Editor } from "@tiptap/react"
import { suggestLinks, type LinkSuggestion } from "@/app/actions/ai/links"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sparkles, Link2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface AILinkSuggestionsTiptapProps {
  /** Tiptap 编辑器实例 */
  editor: Editor
  /** 当前笔记 ID（可选） */
  currentNoteId?: string
  /** 插入链接的回调 */
  onInsertLink: (noteTitle: string) => void
  /** 是否禁用 */
  disabled?: boolean
}

export function AILinkSuggestionsTiptap({
  editor,
  currentNoteId,
  onInsertLink,
  disabled = false,
}: AILinkSuggestionsTiptapProps) {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 获取编辑器内容（Markdown 格式）
  const getContent = () => {
    // 从 Tiptap 获取 HTML，然后转换为 Markdown
    // 注意：这里需要导入 htmlToMarkdown
    const html = editor.getHTML()
    // 暂时直接使用 HTML，后续可以转换为 Markdown
    return html
  }

  // 获取光标附近的文本（用于分析上下文）
  const getContextText = () => {
    const { state } = editor.view
    const { selection } = state
    const { $from } = selection

    // 获取光标前后的文本
    const start = Math.max(0, $from.pos - 100)
    const end = Math.min(state.doc.content.size, $from.pos + 100)
    const text = state.doc.textBetween(start, end)

    return text
  }

  // 检测是否需要显示建议（当用户输入 `[[` 时）
  const shouldShowSuggestions = () => {
    if (disabled || !editor) return false

    const { state } = editor.view
    const { selection } = state
    const { $from } = selection

    // 检查光标前是否有 `[[`
    const textBefore = state.doc.textBetween(
      Math.max(0, $from.pos - 2),
      $from.pos
    )
    return textBefore === "[["
  }

  // 获取建议
  const fetchSuggestions = async () => {
    if (disabled || !editor) {
      setSuggestions([])
      return
    }

    const content = getContent()
    if (content.trim().length < 10) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const contextText = getContextText()
      const results = await suggestLinks(contextText, currentNoteId, 5)
      setSuggestions(results)

      // 如果有建议，打开弹窗
      if (results.length > 0) {
        setIsOpen(true)
        setSelectedIndex(0)
      } else {
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Failed to fetch link suggestions:", error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 防抖获取建议
  useEffect(() => {
    if (!editor) return

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 监听编辑器更新
    const handleUpdate = () => {
      // 如果检测到 `[[`，立即显示建议
      if (shouldShowSuggestions()) {
        fetchSuggestions()
        return
      }

      // 否则，延迟获取建议（防抖）
      debounceTimerRef.current = setTimeout(() => {
        const content = getContent()
        if (content.trim().length >= 50) {
          fetchSuggestions()
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      }, 800) // 800ms 防抖
    }

    editor.on("update", handleUpdate)
    editor.on("selectionUpdate", handleUpdate)

    return () => {
      editor.off("update", handleUpdate)
      editor.off("selectionUpdate", handleUpdate)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [editor, currentNoteId, disabled])

  // 处理键盘导航
  useEffect(() => {
    if (!isOpen || suggestions.length === 0 || !editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleInsertLink(suggestions[selectedIndex].title)
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, suggestions, selectedIndex, editor])

  // 插入链接
  const handleInsertLink = (noteTitle: string) => {
    onInsertLink(noteTitle)
    setIsOpen(false)
    setSuggestions([])
  }

  // 如果没有建议，不显示
  if (!isOpen && suggestions.length === 0 && !isLoading) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "absolute top-2 right-2 z-10 gap-2",
            !isOpen && suggestions.length === 0 && "opacity-0 pointer-events-none"
          )}
          onClick={() => {
            if (suggestions.length === 0) {
              fetchSuggestions()
            } else {
              setIsOpen(!isOpen)
            }
          }}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="text-xs">分析中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">
                {suggestions.length > 0 ? `${suggestions.length} 个建议` : "获取建议"}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        side="top"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">链接建议</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
              <span className="ml-2 text-sm text-muted-foreground">正在分析...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>未找到相关笔记</p>
              <p className="text-xs mt-1">尝试输入更多内容</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-accent focus:bg-accent focus:outline-none",
                    index === selectedIndex && "bg-accent"
                  )}
                  onClick={() => handleInsertLink(suggestion.title)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.title}</div>
                      {suggestion.excerpt && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.excerpt}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        相似度: {Math.round(suggestion.similarity * 100)}%
                      </div>
                    </div>
                    <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground px-2">
            <p>💡 提示：输入 <code className="px-1 py-0.5 bg-muted rounded">[[</code> 可快速触发建议</p>
            <p className="mt-1">使用 ↑↓ 键导航，Enter 键插入</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

