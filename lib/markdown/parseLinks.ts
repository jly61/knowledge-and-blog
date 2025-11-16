/**
 * 解析 Markdown 内容中的双向链接 [[笔记标题]]
 */

export interface ParsedLink {
  text: string // 链接文本（笔记标题）
  start: number // 在内容中的起始位置
  end: number // 在内容中的结束位置
  context?: string // 链接上下文（前后各 50 个字符）
}

/**
 * 解析内容中的所有双向链接
 */
export function parseLinks(content: string): ParsedLink[] {
  const links: ParsedLink[] = []
  // 匹配 [[笔记标题]] 格式
  const linkRegex = /\[\[([^\]]+)\]\]/g
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1].trim()
    const start = match.index
    const end = match.index + match[0].length

    // 提取上下文（前后各 50 个字符）
    const contextStart = Math.max(0, start - 50)
    const contextEnd = Math.min(content.length, end + 50)
    const context = content.slice(contextStart, contextEnd)

    links.push({
      text,
      start,
      end,
      context,
    })
  }

  return links
}

/**
 * 将双向链接转换为 HTML 链接
 */
export function renderLinks(content: string, baseUrl: string = '/notes'): string {
  return content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, noteTitle) => {
      const slug = encodeURIComponent(noteTitle)
      return `[${noteTitle}](${baseUrl}/${slug})`
    }
  )
}

/**
 * 提取内容中提到的所有笔记标题（包括链接和普通文本）
 */
export function extractNoteMentions(content: string): string[] {
  const mentions = new Set<string>()

  // 提取双向链接中的标题
  const linkRegex = /\[\[([^\]]+)\]\]/g
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    mentions.add(match[1].trim())
  }

  return Array.from(mentions)
}

