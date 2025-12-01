"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Card, CardContent } from "@/components/ui/card"
import { useMemo } from "react"
import type { Components } from "react-markdown"
import type { ReactNode } from "react"
import "highlight.js/styles/github-dark.css"

interface InterviewContentProps {
  content?: string
  toc?: Array<{ level: number; text: string; id: string }>
}

// 生成标题 ID 的辅助函数（与服务端逻辑一致，支持中文）
function generateHeadingId(text: string): string {
  let cleanText = String(text).trim()
  // 移除标题中的链接标记
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
  
  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText)
  
  if (hasChinese) {
    // 对于中文标题，使用 URL 编码但保持可读性
    let id = cleanText
      .toLowerCase()
      // 保留中文字符、字母、数字、空格和连字符
      .replace(/[^\u4e00-\u9fa5\w\s-]/g, "")
      // 将多个空格替换为单个连字符
      .replace(/\s+/g, "-")
      // 移除首尾连字符
      .replace(/^-+|-+$/g, "")
    
    // 如果处理后为空，使用编码方式
    if (!id || id === "") {
      id = encodeURIComponent(cleanText)
        .replace(/%/g, "-")
        .toLowerCase()
    }
    
    return id
  } else {
    // 对于英文标题，使用原来的方式
    let id = cleanText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
    
    // 如果处理后为空，使用时间戳
    if (!id || id === "") {
      id = `heading-${Date.now()}`
    }
    
    return id
  }
}

export function InterviewContent({ content, toc }: InterviewContentProps) {
  // 从 TOC 创建文本到 ID 的直接映射（使用原始文本作为 key，最准确）
  const textToIdDirectMap = useMemo(() => {
    const map = new Map<string, string>()
    if (toc) {
      toc.forEach((item) => {
        // 使用原始文本作为 key（不进行任何处理）
        map.set(item.text, item.id)
      })
    }
    return map
  }, [toc])

  // 从 TOC 创建文本到 ID 的映射（使用生成的 ID 作为 key，作为后备）
  const textToIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (toc) {
      toc.forEach((item) => {
        // 使用与服务端相同的 ID 生成逻辑作为 key
        const key = generateHeadingId(item.text)
        map.set(key, item.id)
      })
    }
    return map
  }, [toc])

  // 自定义标题渲染，使用服务端生成的 ID
  const markdownComponents: Components = useMemo(() => {
    const idCounter = new Map<string, number>()

    // 提取文本内容的辅助函数（处理 React 元素）
    const extractText = (children: ReactNode): string => {
      if (typeof children === 'string') {
        return children
      }
      if (typeof children === 'number') {
        return String(children)
      }
      if (Array.isArray(children)) {
        return children.map(extractText).join('')
      }
      if (children && typeof children === 'object' && 'props' in children) {
        return extractText(children.props.children)
      }
      return ''
    }

    const getHeadingId = (children: ReactNode): string => {
      // 提取纯文本内容
      const text = extractText(children)
      const cleanText = text.trim().replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      
      // 首先尝试直接从文本映射中获取 ID（最准确）
      if (textToIdDirectMap.has(cleanText)) {
        return textToIdDirectMap.get(cleanText)!
      }
      
      // 如果直接映射中没有，尝试使用生成的 baseId 查找
      const baseId = generateHeadingId(cleanText)
      if (textToIdMap.has(baseId)) {
        return textToIdMap.get(baseId)!
      }
      
      // 如果 TOC 中都没有，说明这是新出现的标题（不应该发生，但作为后备）
      // 使用计数器处理重复，但这种情况应该避免
      if (idCounter.has(baseId)) {
        const count = idCounter.get(baseId)! + 1
        idCounter.set(baseId, count)
        return `${baseId}-${count}`
      } else {
        idCounter.set(baseId, 0)
        return baseId
      }
    }

    return {
      h1: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h1 id={id} {...props} className="scroll-mt-20">
            {children}
          </h1>
        )
      },
      h2: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h2 id={id} {...props} className="scroll-mt-20">
            {children}
          </h2>
        )
      },
      h3: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h3 id={id} {...props} className="scroll-mt-20">
            {children}
          </h3>
        )
      },
      h4: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h4 id={id} {...props} className="scroll-mt-20">
            {children}
          </h4>
        )
      },
      h5: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h5 id={id} {...props} className="scroll-mt-20">
            {children}
          </h5>
        )
      },
      h6: ({ children, ...props }) => {
        const id = getHeadingId(children)
        return (
          <h6 id={id} {...props} className="scroll-mt-20">
            {children}
          </h6>
        )
      },
    }
  }, [textToIdMap, textToIdDirectMap])

  if (!content) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">请从左侧选择一道面试题</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 px-6 pb-6">
        <div className="prose prose-slate dark:prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-foreground
                    prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:border-b prose-h1:border-border prose-h1:pb-3
                    prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:font-semibold
                    prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:font-semibold
                    prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2 prose-h4:font-semibold
                    prose-p:text-foreground prose-p:leading-7 prose-p:my-4
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-em:text-foreground prose-em:italic
                    prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-pre:bg-[#0d1117] dark:prose-pre:bg-[#0d1117] prose-pre:text-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border prose-pre:shadow-sm
                    prose-pre:code:bg-transparent prose-pre:code:text-inherit prose-pre:code:p-0 prose-pre:code:before:content-none prose-pre:code:after:content-none
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:rounded-r
                    prose-ul:list-disc prose-ul:my-4 prose-ul:pl-6
                    prose-ol:list-decimal prose-ol:my-4 prose-ol:pl-6
                    prose-li:my-2 prose-li:leading-7
                    prose-hr:my-8 prose-hr:border-border prose-hr:border-t-2
                    prose-table:w-full prose-table:my-6 prose-table:border-collapse
                    prose-thead:border-b prose-thead:border-border
                    prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:bg-muted/50
                    prose-td:px-4 prose-td:py-2 prose-td:border-b prose-td:border-border
                    prose-img:rounded-lg prose-img:shadow-md prose-img:my-6 prose-img:border prose-img:border-border">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}
