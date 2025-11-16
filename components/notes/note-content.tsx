"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import { LinkPreview } from "@/components/notes/link-preview"
import type { Components } from "react-markdown"

interface NoteContentProps {
  content: string
  noteTitleMap: Map<string, string>
}

export function NoteContent({ content, noteTitleMap }: NoteContentProps) {
  // 预处理内容：将 [[笔记标题]] 转换为 Markdown 链接格式
  const processedContent = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_match: string, noteTitle: string) => {
      const noteId = noteTitleMap.get(noteTitle.toLowerCase()) || noteTitleMap.get(noteTitle)
      if (noteId) {
        return `[${noteTitle}](/notes/${noteId})`
      } else {
        return `[${noteTitle}](broken:${noteTitle})`
      }
    }
  )

  // 自定义 react-markdown 组件
  const markdownComponents: Components = {
    a: ({ href, children, ...props }) => {
      // 处理断链
      if (href?.startsWith("broken:")) {
        const noteTitle = href.replace("broken:", "")
        return (
          <span
            className="text-muted-foreground border-b border-dashed border-muted-foreground cursor-help"
            title="笔记不存在，点击创建"
          >
            {children}
          </span>
        )
      }

      // 处理笔记链接（添加预览功能）
      if (href?.startsWith("/notes/")) {
        const noteId = href.replace("/notes/", "")
        return (
          <LinkPreview noteId={noteId}>
            <Link
              href={href}
              className="text-primary hover:underline font-medium"
              {...props}
            >
              {children}
            </Link>
          </LinkPreview>
        )
      }

      // 处理外部链接
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          {...props}
        >
          {children}
        </a>
      )
    },
  }

  return (
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

