"use client"

interface HighlightTextProps {
  text: string
  query: string
}

/**
 * 高亮显示搜索关键词
 */
export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query.trim()) {
    return <>{text}</>
  }

  // 转义特殊字符，用于正则表达式
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escapedQuery})`, "gi")
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        // 检查是否是匹配的部分（大小写不敏感）
        if (part.toLowerCase() === query.toLowerCase()) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded"
            >
              {part}
            </mark>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

