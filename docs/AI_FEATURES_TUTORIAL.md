# AI 功能开发教学文档

## 📚 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [核心功能实现](#核心功能实现)
4. [关键技术详解](#关键技术详解)
5. [代码结构说明](#代码结构说明)
6. [使用示例](#使用示例)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## 概述

本文档详细讲解知识库+博客系统中 AI 对话功能的完整实现，包括：

- **前端**：React Hook 实现聊天状态管理
- **后端**：Next.js API 路由处理流式响应
- **AI 服务**：支持 OpenAI 和 Ollama 本地模型
- **流式响应**：实现打字机效果

### 技术栈

- **前端框架**：Next.js 14 (App Router) + React 18
- **AI SDK**：自定义 `useChat` Hook（兼容 AI SDK v5）
- **流式处理**：Server-Sent Events (SSE) 格式
- **AI 服务**：OpenAI API / Ollama 本地模型
- **UI 组件**：shadcn/ui + Tailwind CSS

---

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户界面层                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ChatSidebar (侧边栏组件)                          │  │
│  │  - 消息列表显示                                    │  │
│  │  - 输入框（支持中文输入法）                        │  │
│  │  - 流式响应展示                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   状态管理层                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  useChat Hook                                     │  │
│  │  - 消息状态管理                                    │  │
│  │  - 输入状态管理                                    │  │
│  │  - 流式响应处理                                    │  │
│  │  - 错误处理                                        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    API 路由层                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/ai/chat                                     │  │
│  │  - 接收消息请求                                    │  │
│  │  - 调用 AI 服务                                    │  │
│  │  - 返回流式响应                                    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    AI 服务层                             │
│  ┌──────────────┐          ┌──────────────┐            │
│  │  OpenAI API  │          │  Ollama      │            │
│  │  (云端)      │          │  (本地)      │            │
│  └──────────────┘          └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### 数据流

```
用户输入
  ↓
ChatSidebar 组件
  ↓
useChat Hook (handleSubmit)
  ↓
POST /api/ai/chat
  ↓
AI 服务 (OpenAI/Ollama)
  ↓
流式响应 (SSE 格式)
  ↓
useChat Hook (解析并更新状态)
  ↓
ChatSidebar 组件 (实时显示)
```

---

## 核心功能实现

### 1. useChat Hook 实现

#### 1.1 状态管理

```typescript
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
```

**设计要点**：
- 使用 `useState` 管理所有状态
- 使用 `useRef` 存储 AbortController，避免重新渲染
- 消息列表包含完整的对话历史

#### 1.2 消息提交流程

```typescript
const handleSubmit = useCallback(async (e) => {
  // 1. 验证输入
  if (!input.trim() || isLoading) return

  // 2. 创建用户消息
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input.trim(),
  }

  // 3. 更新消息列表
  const currentMessages = [...messages, userMessage]
  setMessages(currentMessages)
  setInput("")
  setIsLoading(true)

  // 4. 创建助手消息占位符（用于流式更新）
  const assistantMessageId = (Date.now() + 1).toString()
  setMessages((prev) => [
    ...prev,
    { id: assistantMessageId, role: "assistant", content: "" },
  ])

  // 5. 发送请求并处理流式响应
  // ... (详见下文)
}, [input, isLoading, messages, api, onError])
```

**关键设计**：
- 先创建空的助手消息占位符，然后流式更新内容
- 使用 `Date.now()` 生成唯一 ID（生产环境建议使用 UUID）
- 清空输入框，提供即时反馈

#### 1.3 流式响应处理

```typescript
// 获取流式响应读取器
const reader = response.body?.getReader()
const decoder = new TextDecoder()

// 缓冲区用于处理不完整的行
let buffer = ""

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  // 解码数据并添加到缓冲区
  buffer += decoder.decode(value, { stream: true })

  // 解析 SSE 格式的数据
  const lines = buffer.split("\n")
  buffer = lines.pop() || "" // 保留最后一个不完整的行

  for (const line of lines) {
    if (line.startsWith("0:")) {
      // 数据行：包含文本增量
      const data = JSON.parse(line.slice(2))
      if (data.type === "text-delta" && data.textDelta) {
        // 流式更新助手消息内容
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
    } else if (line.startsWith("d:")) {
      // 完成标记
      break
    } else if (line.startsWith("e:")) {
      // 错误标记
      const errorData = JSON.parse(line.slice(2))
      throw new Error(errorData.error || "未知错误")
    }
  }
}
```

**SSE 格式说明**：
- `0:{...}`：数据行，包含 JSON 数据
- `d:{...}`：完成标记
- `e:{...}`：错误标记

**缓冲区处理**：
- 使用 `buffer` 存储不完整的行
- 每次读取后，处理完整的行，保留不完整的行

### 2. API 路由实现

#### 2.1 路由结构

```typescript
// app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json()

  // 优先使用 OpenAI
  if (process.env.OPENAI_API_KEY) {
    // ... OpenAI 处理
  }

  // 使用 Ollama 本地模型
  // ... Ollama 处理
}
```

#### 2.2 OpenAI 流式响应

```typescript
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

const result = await streamText({
  model: openai("gpt-3.5-turbo"),
  system: BASE_SYSTEM_PROMPT,
  messages: messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  })),
  maxTokens: 2000,
})

return result.toDataStreamResponse()
```

**特点**：
- 使用 Vercel AI SDK 的 `streamText`
- 自动处理流式响应格式
- 返回标准的 SSE 格式

#### 2.3 Ollama 流式响应

```typescript
// 检查 Ollama 服务是否可用
const healthCheck = await fetch(`${ollamaBaseUrl}/api/tags`, {
  signal: AbortSignal.timeout(2000),
})

// 获取推荐模型
const model = await getRecommendedModel()

// 调用 Ollama API
const response = await ollamaClient.chat({
  model,
  messages: ollamaMessages,
  stream: true,
})

// 转换为 SSE 格式
const encoder = new TextEncoder()
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of response) {
      if (chunk.message?.content) {
        const data = JSON.stringify({
          type: "text-delta",
          textDelta: chunk.message.content,
        })
        controller.enqueue(encoder.encode(`0:${data}\n`))
      }
    }
    // 发送完成标记
    controller.enqueue(encoder.encode(`d:{"type":"finish"}\n`))
    controller.close()
  },
})
```

**关键点**：
- 手动创建 `ReadableStream`
- 将 Ollama 的响应格式转换为 SSE 格式
- 使用 `TextEncoder` 编码数据

### 3. 前端组件实现

#### 3.1 ChatSidebar 组件

```typescript
export function ChatSidebar({ noteId, noteTitle }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isComposing, setIsComposing] = useState(false) // 输入法状态
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/ai/chat",
    })

  return (
    <>
      {/* 触发按钮 */}
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)}>
          <MessageSquare />
        </Button>
      )}

      {/* 侧边栏 */}
      <div className={cn("fixed right-0 top-0 h-full w-96", isOpen ? "translate-x-0" : "translate-x-full")}>
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          {messages
            .filter((message) => message.role !== "system")
            .map((message) => (
              <ChatMessage key={message.id} role={message.role} content={message.content} />
            ))}
        </div>

        {/* 输入框 */}
        <Input
          value={input}
          onChange={handleInputChange}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            // 如果正在输入法组合中，不处理 Enter 键
            if (isComposing) return
            
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (input.trim() && !isLoading) {
                handleSubmit(e as any)
              }
            }
          }}
        />
      </div>
    </>
  )
}
```

**关键特性**：
- **输入法支持**：使用 `isComposing` 状态检测中文输入
- **自动滚动**：使用 `useEffect` 和 `ref` 实现自动滚动到底部
- **响应式设计**：使用 Tailwind CSS 实现侧边栏动画

#### 3.2 ChatMessage 组件

```typescript
export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3 p-4", isUser ? "bg-muted/50" : "bg-background")}>
      {/* 头像 */}
      <div className={cn("w-8 h-8 rounded-full", isUser ? "bg-primary" : "bg-secondary")}>
        {isUser ? <User /> : <Bot />}
      </div>

      {/* 消息内容 */}
      <div className="flex-1">
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
```

**设计要点**：
- 用户消息：纯文本显示
- 助手消息：Markdown 渲染（支持代码块、表格等）
- 使用 `react-markdown` 和 `remark-gfm` 插件

---

## 关键技术详解

### 1. 流式响应处理

#### 为什么需要流式响应？

- **用户体验**：打字机效果，即时反馈
- **性能优化**：不需要等待完整响应
- **实时性**：用户可以立即看到 AI 的回复

#### SSE 格式详解

```
0:{"type":"text-delta","textDelta":"你"}
0:{"type":"text-delta","textDelta":"好"}
0:{"type":"text-delta","textDelta":"！"}
d:{"type":"finish"}
```

- `0:`：数据行前缀
- `d:`：完成标记前缀
- `e:`：错误标记前缀

#### 缓冲区处理

```typescript
let buffer = ""

// 读取数据
buffer += decoder.decode(value, { stream: true })

// 分割行
const lines = buffer.split("\n")
buffer = lines.pop() || "" // 保留最后一个不完整的行

// 处理完整的行
for (const line of lines) {
  // 处理逻辑
}
```

**为什么需要缓冲区？**
- 网络数据可能不完整
- 一个数据块可能包含多行
- 一行可能被分割到多个数据块中

### 2. 输入法组合状态处理

#### 问题

在输入中文时，Enter 键会触发输入法的确认，而不是发送消息。

#### 解决方案

```typescript
const [isComposing, setIsComposing] = useState(false)

<Input
  onCompositionStart={() => setIsComposing(true)}
  onCompositionEnd={() => setIsComposing(false)}
  onKeyDown={(e) => {
    if (isComposing) return // 正在输入法组合中，不处理
    // ... 处理 Enter 键
  }}
/>
```

**事件说明**：
- `compositionstart`：开始输入法组合（如开始输入拼音）
- `compositionend`：结束输入法组合（如选择汉字）

### 3. 请求取消机制

#### 使用 AbortController

```typescript
// 创建 AbortController
abortControllerRef.current = new AbortController()

// 在 fetch 中使用
const response = await fetch(api, {
  signal: abortControllerRef.current.signal,
})

// 取消请求
const stop = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
}
```

**使用场景**：
- 用户点击停止按钮
- 组件卸载时取消请求
- 发送新消息时取消旧请求

### 4. 错误处理

#### 错误类型

1. **网络错误**：连接失败、超时
2. **API 错误**：服务器返回错误状态码
3. **解析错误**：JSON 解析失败
4. **取消错误**：用户主动取消

#### 错误处理策略

```typescript
try {
  // ... 请求逻辑
} catch (err) {
  if (err instanceof Error) {
    if (err.name === "AbortError") {
      // 用户取消，移除空消息
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
      return
    }

    // 其他错误
    setError(err)
    if (onError) {
      onError(err)
    }
    // 移除空消息
    setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId))
  }
}
```

---

## 代码结构说明

### 文件结构

```
lib/
  ai/
    ├── use-chat.ts          # 自定义 useChat Hook
    ├── ollama-client.ts     # Ollama 客户端配置
    ├── client.ts            # AI 客户端配置（OpenAI）
    └── prompts.ts           # Prompt 模板

components/
  ai/
    ├── chat-sidebar.tsx     # 聊天侧边栏组件
    └── chat-message.tsx     # 消息显示组件

app/
  api/
    ai/
      chat/
        └── route.ts         # 聊天 API 路由
```

### 依赖关系

```
ChatSidebar
  └── useChat (lib/ai/use-chat.ts)
      └── POST /api/ai/chat
          ├── OpenAI (lib/ai/client.ts)
          └── Ollama (lib/ai/ollama-client.ts)
```

---

## 使用示例

### 基础使用

```typescript
import { useChat } from "@/lib/ai/use-chat"

function MyComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/chat",
  })

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <button type="submit" disabled={isLoading}>
        发送
      </button>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </form>
  )
}
```

### 自定义错误处理

```typescript
const { error, setMessages } = useChat({
  api: "/api/ai/chat",
  onError: (error) => {
    console.error("聊天错误:", error)
    // 可以显示 toast 通知
    toast.error(error.message)
  },
})
```

### 重新发送消息

```typescript
const { reload } = useChat({
  api: "/api/ai/chat",
})

// 重新发送最后一条消息
<button onClick={reload}>重新发送</button>
```

### 停止请求

```typescript
const { stop, isLoading } = useChat({
  api: "/api/ai/chat",
})

// 停止当前请求
{isLoading && <button onClick={stop}>停止</button>}
```

---

## 最佳实践

### 1. 状态管理

✅ **推荐**：
- 使用 `useState` 管理简单状态
- 使用 `useRef` 存储不需要触发渲染的值
- 使用 `useCallback` 优化函数引用

❌ **不推荐**：
- 在组件中直接修改 props
- 使用全局状态管理简单对话

### 2. 性能优化

✅ **推荐**：
- 使用 `useCallback` 缓存函数
- 使用 `useMemo` 缓存计算结果
- 流式更新时使用函数式更新

```typescript
// ✅ 正确：使用函数式更新
setMessages((prev) => {
  const newMessages = [...prev]
  newMessages[lastIndex].content += delta
  return newMessages
})

// ❌ 错误：直接修改状态
messages[lastIndex].content += delta
setMessages(messages)
```

### 3. 错误处理

✅ **推荐**：
- 区分不同类型的错误
- 提供用户友好的错误提示
- 记录错误日志

```typescript
try {
  // ...
} catch (err) {
  if (err instanceof Error) {
    // 区分错误类型
    if (err.name === "AbortError") {
      // 用户取消，静默处理
      return
    }
    // 其他错误，显示提示
    setError(err)
    toast.error(err.message)
  }
}
```

### 4. 类型安全

✅ **推荐**：
- 使用 TypeScript 定义接口
- 使用类型断言时确保安全
- 避免使用 `any` 类型

```typescript
// ✅ 正确：定义明确的类型
interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

// ❌ 错误：使用 any
const message: any = { ... }
```

---

## 常见问题

### Q1: 为什么流式响应不工作？

**可能原因**：
1. API 路由没有正确返回流式响应
2. 前端没有正确解析 SSE 格式
3. 网络连接问题

**解决方案**：
1. 检查 API 路由的响应头：`Content-Type: text/plain`
2. 检查 SSE 格式是否正确：`0:{...}\n`
3. 使用浏览器开发者工具查看网络请求

### Q2: 中文输入时回车键发送消息？

**解决方案**：
使用 `isComposing` 状态检测输入法组合状态：

```typescript
const [isComposing, setIsComposing] = useState(false)

<Input
  onCompositionStart={() => setIsComposing(true)}
  onCompositionEnd={() => setIsComposing(false)}
  onKeyDown={(e) => {
    if (isComposing) return
    // 处理 Enter 键
  }}
/>
```

### Q3: 如何实现消息持久化？

**解决方案**：
1. 使用 localStorage 存储消息
2. 使用数据库存储对话历史
3. 使用 IndexedDB 存储大量数据

```typescript
// 使用 localStorage
useEffect(() => {
  localStorage.setItem("chat-messages", JSON.stringify(messages))
}, [messages])

useEffect(() => {
  const saved = localStorage.getItem("chat-messages")
  if (saved) {
    setMessages(JSON.parse(saved))
  }
}, [])
```

### Q4: 如何优化流式响应性能？

**优化建议**：
1. 使用防抖（debounce）减少状态更新频率
2. 使用虚拟滚动处理大量消息
3. 使用 Web Workers 处理复杂计算

```typescript
// 防抖更新
const debouncedUpdate = useMemo(
  () => debounce((delta: string) => {
    setMessages((prev) => {
      // 更新逻辑
    })
  }, 50),
  []
)
```

### Q5: 如何支持多轮对话上下文？

**解决方案**：
在 API 路由中传递完整的消息历史：

```typescript
// 前端
const response = await fetch(api, {
  body: JSON.stringify({
    messages: currentMessages, // 包含所有历史消息
  }),
})

// 后端
const { messages } = await req.json()
// messages 包含完整的对话历史
```

---

## 总结

本文档详细讲解了 AI 对话功能的完整实现，包括：

1. **架构设计**：清晰的分层架构
2. **核心实现**：流式响应、状态管理、错误处理
3. **关键技术**：SSE 格式、输入法处理、请求取消
4. **最佳实践**：性能优化、类型安全、错误处理

通过本文档，你可以：
- 理解整个 AI 对话功能的实现原理
- 学习流式响应的处理方式
- 掌握 React Hook 的最佳实践
- 解决常见的开发问题

---

## 参考资料

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [Ollama 文档](https://ollama.ai/docs)
- [Server-Sent Events 规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [React Hooks 文档](https://react.dev/reference/react)

---

**最后更新**：2024-12-03

