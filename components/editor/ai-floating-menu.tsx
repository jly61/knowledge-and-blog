"use client"

/**
 * AI 编辑器悬浮菜单组件
 *
 * 当用户选中文本时，显示悬浮菜单，提供润色、扩写、缩写、翻译等功能
 * 支持 Textarea 模式
 */

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Wand2,
  Expand,
  Minimize2,
  Languages,
  Loader2,
} from "lucide-react"
import { EditorAction, TargetLanguage } from "@/app/actions/ai/editor-assistant"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AIFloatingMenuProps {
  /** Textarea 元素引用 */
  textareaRef: React.RefObject<HTMLTextAreaElement>
  /** 当前内容 */
  content: string
  /** 内容变化回调 */
  onContentChange: (content: string) => void
  /** 是否禁用（例如输入法激活时） */
  disabled?: boolean
}

/**
 * 计算 Textarea 中选中文本的位置
 * 
 * 使用更简单的方法：基于 textarea 的位置和选中文本的起始位置
 */
function getSelectionPosition(
  textarea: HTMLTextAreaElement,
  content: string
): {
  top: number
  left: number
  width: number
} | null {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  if (start === end) {
    return null // 没有选中文本
  }

  // 获取 textarea 的位置和样式
  const textareaRect = textarea.getBoundingClientRect()
  const style = window.getComputedStyle(textarea)
  
  // 计算 padding
  const paddingTop = parseFloat(style.paddingTop) || 0
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  
  // 计算行高和字体大小
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
  const fontSize = parseFloat(style.fontSize) || 14
  
  // 计算选中文本的起始位置（行号和列号）
  const textBefore = content.substring(0, start)
  const lines = textBefore.split("\n")
  const lineNumber = lines.length - 1
  const columnNumber = lines[lines.length - 1].length
  
  // 计算选中文本的长度（用于估算宽度）
  const selectedText = content.substring(start, end)
  const selectedLines = selectedText.split("\n")
  const maxLineLength = Math.max(...selectedLines.map(line => line.length))
  
  // 估算选中文本的宽度（使用字符宽度，中文字符约为字体大小的 1.2 倍）
  const charWidth = fontSize * 0.6 // 平均字符宽度
  const estimatedWidth = Math.min(maxLineLength * charWidth, textareaRect.width - paddingLeft * 2)
  
  // 计算选中文本的垂直位置
  const top = textareaRect.top + paddingTop + lineNumber * lineHeight + window.scrollY - 40
  // 计算选中文本的水平位置（居中显示）
  const left = textareaRect.left + paddingLeft + columnNumber * charWidth + estimatedWidth / 2 + window.scrollX
  
  return {
    top,
    left,
    width: estimatedWidth,
  }
}

/**
 * 获取选中文本
 */
function getSelectedText(textarea: HTMLTextAreaElement): string {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  return textarea.value.substring(start, end)
}

export function AIFloatingMenu({
  textareaRef,
  content,
  onContentChange,
  disabled = false,
}: AIFloatingMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [selectedText, setSelectedText] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<EditorAction | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  /**
   * 检测选中文本并更新菜单位置
   */
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || disabled) {
      setPosition(null)
      return
    }

    const handleSelection = () => {
      const text = getSelectedText(textarea)
      if (text.trim().length > 0) {
        setSelectedText(text)
        const pos = getSelectionPosition(textarea, content)
        setPosition(pos)
      } else {
        setPosition(null)
        setSelectedText("")
      }
    }

    // 监听选中事件
    textarea.addEventListener("select", handleSelection)
    textarea.addEventListener("mouseup", handleSelection)
    textarea.addEventListener("keyup", handleSelection)

    // 点击外部时隐藏菜单
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        textarea &&
        !textarea.contains(e.target as Node)
      ) {
        setPosition(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      textarea.removeEventListener("select", handleSelection)
      textarea.removeEventListener("mouseup", handleSelection)
      textarea.removeEventListener("keyup", handleSelection)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [textareaRef, content, disabled])

  /**
   * 执行 AI 操作
   */
  const handleAction = async (action: EditorAction, targetLang?: TargetLanguage) => {
    const textarea = textareaRef.current
    if (!textarea || !selectedText.trim() || isProcessing) {
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    setIsProcessing(true)
    setProcessingAction(action)
    setPosition(null) // 隐藏菜单

    try {
      // 调用 API Route 获取流式响应
      const response = await fetch("/api/ai/editor-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          text: selectedText,
          targetLang,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "请求失败")
      }

      if (!response.body) {
        throw new Error("无法获取流式响应")
      }

      // 读取流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      let buffer = ""

      // 保存原始内容，用于替换
      const textBefore = content.substring(0, start)
      const textAfter = content.substring(end)

      // 使用 requestAnimationFrame 来优化流式更新性能
      let lastUpdateTime = 0
      const updateInterval = 50 // 每 50ms 更新一次，避免过于频繁的更新

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const data = JSON.parse(line.slice(2))
              if (data.type === "text-delta" && data.textDelta) {
                fullText += data.textDelta
                
                // 节流更新，避免过于频繁的 DOM 操作
                const now = Date.now()
                if (now - lastUpdateTime >= updateInterval) {
                  // 流式更新内容
                  const newContent = textBefore + fullText + textAfter
                  onContentChange(newContent)

                  // 更新选中区域，显示流式效果
                  requestAnimationFrame(() => {
                    if (textarea) {
                      const newEnd = start + fullText.length
                      textarea.setSelectionRange(start, newEnd)
                    }
                  })
                  
                  lastUpdateTime = now
                }
              }
            } catch (e) {
              // 忽略 JSON 解析错误
            }
          } else if (line.startsWith("d:")) {
            // 完成，执行最后一次更新
            const newContent = textBefore + fullText + textAfter
            onContentChange(newContent)
            break
          } else if (line.startsWith("e:")) {
            // 错误
            try {
              const errorData = JSON.parse(line.slice(2))
              throw new Error(errorData.error || "未知错误")
            } catch (e) {
              if (e instanceof Error) throw e
            }
          }
        }
      }

      // 替换完成后，恢复光标位置
      requestAnimationFrame(() => {
        if (textarea) {
          const newEnd = start + fullText.length
          textarea.setSelectionRange(newEnd, newEnd)
          textarea.focus()
        }
      })

      toast.success(`${getActionName(action)}完成`)
    } catch (error) {
      console.error("AI action error:", error)
      toast.error(
        error instanceof Error
          ? `${getActionName(action)}失败: ${error.message}`
          : `${getActionName(action)}失败`
      )
      // 恢复原始内容
      onContentChange(content)
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  /**
   * 获取操作名称
   */
  const getActionName = (action: EditorAction): string => {
    const names: Record<EditorAction, string> = {
      polish: "润色",
      expand: "扩写",
      summarize: "缩写",
      translate: "翻译",
    }
    return names[action]
  }

  // 如果没有选中文本或位置，不显示菜单
  if (!position || !selectedText.trim() || disabled) {
    return null
  }

  // 计算菜单位置（居中显示在选中文本上方）
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: "translateX(-50%)",
    zIndex: 1000,
  }

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        "flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={menuStyle}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("polish")}
        disabled={isProcessing}
        className="gap-1.5"
        title="润色文本"
      >
        {processingAction === "polish" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Wand2 className="w-3.5 h-3.5" />
        )}
        <span className="text-xs">润色</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("expand")}
        disabled={isProcessing}
        className="gap-1.5"
        title="扩写文本"
      >
        {processingAction === "expand" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Expand className="w-3.5 h-3.5" />
        )}
        <span className="text-xs">扩写</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("summarize")}
        disabled={isProcessing}
        className="gap-1.5"
        title="缩写文本"
      >
        {processingAction === "summarize" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Minimize2 className="w-3.5 h-3.5" />
        )}
        <span className="text-xs">缩写</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("translate", "en")}
        disabled={isProcessing}
        className="gap-1.5"
        title="翻译为英语"
      >
        {processingAction === "translate" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Languages className="w-3.5 h-3.5" />
        )}
        <span className="text-xs">翻译</span>
      </Button>
    </div>
  )

  // 使用 Portal 渲染到 body，避免 z-index 问题
  return typeof window !== "undefined" ? createPortal(menuContent, document.body) : null
}

