/**
 * 生成标题 ID（支持中文）
 * 对于中文标题，使用编码方式；对于英文标题，使用 slug 方式
 */
function generateHeadingId(text: string): string {
  let cleanText = String(text).trim()
  // 移除标题中的链接标记
  cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
  
  // 检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(cleanText)
  
  if (hasChinese) {
    // 对于中文标题，使用 URL 编码但保持可读性
    // 先转换为小写，然后对中文字符进行编码
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
      // 使用简单的哈希方式：将中文字符转换为编码
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
      let id = generateHeadingId(text)

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

