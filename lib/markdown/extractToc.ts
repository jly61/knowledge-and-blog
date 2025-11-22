/**
 * 从 Markdown 内容中提取目录（标题）
 */
export function extractTableOfContents(
  content: string
): Array<{ level: number; text: string; id: string }> {
  const toc: Array<{ level: number; text: string; id: string }> = []
  const lines = content.split("\n")
  const idMap = new Map<string, number>() // 用于处理重复 ID

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      let text = match[2].trim()
      // 移除标题中的链接标记
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      // 生成 ID（用于锚点）
      let id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")

      // 处理重复 ID
      if (idMap.has(id)) {
        const count = idMap.get(id)! + 1
        idMap.set(id, count)
        id = `${id}-${count}`
      } else {
        idMap.set(id, 0)
      }

      toc.push({ level, text, id })
    }
  }

  return toc
}

