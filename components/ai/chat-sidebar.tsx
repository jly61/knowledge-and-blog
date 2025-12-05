"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@/lib/ai/use-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "./chat-message"
import { X, Send, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface ChatSidebarProps {
  noteId?: string
  noteTitle?: string
}

export function ChatSidebar({ noteId, noteTitle }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/chat",
    })

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <>
      {/* 触发按钮 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      )}

      {/* 侧边栏 */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">AI 助手</h3>
            {noteTitle && (
              <p className="text-sm text-muted-foreground truncate">
                {noteTitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                开始与 AI 对话吧！
                {noteTitle && (
                  <>
                    <br />
                    我可以帮你理解这篇笔记的内容。
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages
                .filter((message) => message.role !== "system")
                .map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role as "user" | "assistant"}
                    content={message.content}
                  />
                ))}
              {isLoading && (
                <div className="p-4 flex items-center gap-2 text-muted-foreground">
                  <Spinner size="sm" />
                  <span className="text-sm">AI 正在思考...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm">
              {error.message || "发生错误，请重试"}
            </div>
          )}
        </div>

        {/* 输入框 */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isLoading) {
              handleSubmit(e)
            }
          }}
          className="p-4 border-t"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="输入消息..."
              disabled={isLoading}
              className="flex-1"
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                // 如果正在输入法组合中（如输入中文），不处理 Enter 键
                if (isComposing) {
                  return
                }
                
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (input.trim() && !isLoading) {
                    handleSubmit(e as any)
                  }
                }
              }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            按 Enter 发送，Shift+Enter 换行
          </p>
        </form>
      </div>
    </>
  )
}

