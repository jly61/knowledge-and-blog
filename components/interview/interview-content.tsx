"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card, CardContent } from "@/components/ui/card"
import { useMemo } from "react"
import type { Components } from "react-markdown"

interface InterviewContentProps {
  content?: string
  toc?: Array<{ level: number; text: string; id: string }>
}

// 生成标题 ID 的辅助函数（与服务端逻辑一致）
function generateHeadingId(text: string): string {
  let cleanText = String(text)
  // 移除标题中的链接标记
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
  // 生成 ID（用于锚点）
  return cleanText
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
}

export function InterviewContent({ content, toc }: InterviewContentProps) {
  // 从 TOC 创建文本到 ID 的映射
  const textToIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (toc) {
      toc.forEach((item) => {
        // 使用清理后的文本作为 key
        const cleanText = item.text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
        map.set(cleanText, item.id)
      })
    }
    return map
  }, [toc])

  // 自定义标题渲染，使用服务端生成的 ID
  const markdownComponents: Components = useMemo(() => {
    const idCounter = new Map<string, number>()

    const getHeadingId = (text: string): string => {
      const baseId = generateHeadingId(text)
      
      // 尝试从 TOC 映射中获取 ID
      if (textToIdMap.has(baseId)) {
        return textToIdMap.get(baseId)!
      }
      
      // 如果 TOC 中没有，处理重复 ID
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
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h1 id={id} {...props} className="scroll-mt-20">
            {children}
          </h1>
        )
      },
      h2: ({ children, ...props }) => {
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h2 id={id} {...props} className="scroll-mt-20">
            {children}
          </h2>
        )
      },
      h3: ({ children, ...props }) => {
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h3 id={id} {...props} className="scroll-mt-20">
            {children}
          </h3>
        )
      },
      h4: ({ children, ...props }) => {
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h4 id={id} {...props} className="scroll-mt-20">
            {children}
          </h4>
        )
      },
      h5: ({ children, ...props }) => {
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h5 id={id} {...props} className="scroll-mt-20">
            {children}
          </h5>
        )
      },
      h6: ({ children, ...props }) => {
        const text = String(children)
        const id = getHeadingId(text)
        return (
          <h6 id={id} {...props} className="scroll-mt-20">
            {children}
          </h6>
        )
      },
    }
  }, [textToIdMap])

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
                    prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border prose-pre:shadow-sm
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}
