"use client"

/**
 * AI 聊天 Hook
 * 
 * 提供与 AI 进行对话的完整功能，包括：
 * - 消息管理（发送、接收、流式更新）
 * - 输入状态管理
 * - 错误处理
 * - 请求取消支持
 * 
 * 支持流式响应，实现打字机效果
 */

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * 聊天消息接口
 */
export interface Message {
  /** 消息唯一标识符 */
  id: string
  /** 消息角色：用户、助手或系统 */
  role: "user" | "assistant" | "system"
  /** 消息内容 */
  content: string
}

/**
 * useChat Hook 配置选项
 */
export interface UseChatOptions {
  /** API 端点地址，默认为 "/api/ai/chat" */
  api?: string
  /** 初始消息列表 */
  initialMessages?: Message[]
  /** 错误回调函数 */
  onError?: (error: Error) => void
  /** 笔记 ID（用于 RAG 上下文注入） */
  noteId?: string
}

/**
 * useChat Hook 返回值
 */
export interface UseChatReturn {
  /** 消息列表 */
  messages: Message[]
  /** 当前输入框内容 */
  input: string
  /** 输入框变化处理函数 */
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  /** 表单提交处理函数 */
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  /** 是否正在加载中 */
  isLoading: boolean
  /** 错误对象，如果存在则说明发生了错误 */
  error: Error | null
  /** 设置消息列表 */
  setMessages: (messages: Message[]) => void
  /** 重新发送最后一条用户消息 */
  reload: () => void
  /** 停止当前请求 */
  stop: () => void
}

/**
 * AI 聊天 Hook
 * 
 * 提供完整的聊天功能，包括消息管理、流式响应处理和错误处理
 * 
 * @param options - 配置选项
 * @returns 聊天相关的状态和方法
 * 
 * @example
 * ```tsx
 * const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
 *   api: "/api/ai/chat",
 *   onError: (error) => console.error(error)
 * })
 * ```
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { api = "/api/ai/chat", initialMessages = [], onError, noteId } = options

  // 消息列表状态
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  // 输入框内容状态
  const [input, setInput] = useState("")
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  // 错误状态
  const [error, setError] = useState<Error | null>(null)

  // 用于取消请求的 AbortController 引用
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 处理输入框内容变化
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    []
  )

  /**
   * 停止当前正在进行的请求
   * 取消 fetch 请求并重置加载状态
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }, [])

  /**
   * 处理表单提交
   * 
   * 主要流程：
   * 1. 创建用户消息并添加到消息列表
   * 2. 创建空的助手消息占位符（用于流式更新）
   * 3. 发送请求到 API
   * 4. 处理流式响应，实时更新助手消息内容
   * 5. 处理错误和取消操作
   * 
   * @param e - 表单提交事件
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // 验证输入和状态
      if (!input.trim() || isLoading) return

      // 创建用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
      }

      // 更新消息列表（包含新用户消息）
      const currentMessages = [...messages, userMessage]
      setMessages(currentMessages)
      setInput("")
      setIsLoading(true)
      setError(null)

      // 创建 assistant 消息占位符（用于流式更新）
      const assistantMessageId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ])

      // 创建 AbortController 用于取消请求
      abortControllerRef.current = new AbortController()

      try {
        // 发送请求到 API
        const response = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            noteId, // 传递 noteId 用于 RAG
          }),
          signal: abortControllerRef.current.signal,
        })

        // 检查响应状态
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "请求失败" }))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        // 处理流式响应
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("无法读取响应流")
        }

        // 缓冲区用于处理不完整的行
        let buffer = ""

        // 循环读取流式数据
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          // 解码数据并添加到缓冲区
          buffer += decoder.decode(value, { stream: true })

          // 解析 SSE 格式的数据
          // SSE 格式：0:{"type":"text-delta","textDelta":"..."}\n
          const lines = buffer.split("\n")
          buffer = lines.pop() || "" // 保留最后一个不完整的行

          for (const line of lines) {
            if (line.startsWith("0:")) {
              // 数据行：包含文本增量
              try {
                const data = JSON.parse(line.slice(2))
                if (data.type === "text-delta" && data.textDelta) {
                  // 更新最后一条助手消息的内容（流式追加）
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastIndex = newMessages.length - 1
                    if (lastIndex >= 0 && newMessages[lastIndex].id === assistantMessageId) {
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        content: newMessages[lastIndex].content + data.textDelta,
                      }
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // 忽略 JSON 解析错误，继续处理下一行
              }
            } else if (line.startsWith("d:")) {
              // 完成标记：流式响应结束
              break
            } else if (line.startsWith("e:")) {
              // 错误标记：服务器返回错误
              try {
                const errorData = JSON.parse(line.slice(2))
                throw new Error(errorData.error || "未知错误")
              } catch (e) {
                if (e instanceof Error) throw e
              }
            }
          }
        }

        // 请求成功完成
        setIsLoading(false)
        abortControllerRef.current = null
      } catch (err) {
        // 处理错误
        setIsLoading(false)
        abortControllerRef.current = null

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            // 用户主动取消请求，移除空的 assistant 消息
            setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
            return
          }

          // 设置错误状态并触发错误回调
          setError(err)
          if (onError) {
            onError(err)
          }

          // 移除空的 assistant 消息
          setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
        }
      }
    },
    [input, isLoading, messages, api, onError, noteId]
  )

  /**
   * 重新发送最后一条用户消息
   * 
   * 流程：
   * 1. 找到最后一条用户消息
   * 2. 从消息列表中移除该消息及其后的所有消息
   * 3. 将消息内容填充到输入框
   * 4. 自动重新提交
   */
  const reload = useCallback(() => {
    if (messages.length === 0) return

    // 查找最后一条用户消息
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUserMessage) return

    // 移除该消息及其后的所有消息
    setMessages((prev) => prev.filter((m) => m.id !== lastUserMessage.id))
    // 将消息内容填充到输入框
    setInput(lastUserMessage.content)

    // 重新提交（延迟执行以确保状态更新完成）
    setTimeout(() => {
      const form = document.createElement("form")
      handleSubmit({ preventDefault: () => {}, currentTarget: form } as any)
    }, 0)
  }, [messages, handleSubmit])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    reload,
    stop,
  }
}

