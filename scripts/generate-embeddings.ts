/**
 * 批量向量化脚本
 * 
 * 为所有现有笔记生成向量嵌入
 * 使用方法：pnpm tsx scripts/generate-embeddings.ts
 */

import { db } from "../lib/db"
import { generateEmbedding } from "../lib/ai/embeddings"

async function main() {
  console.log("开始批量向量化笔记...")

  // 获取所有没有向量的笔记
  const notes = await db.$queryRaw<Array<{ id: string; title: string; content: string }>>`
    SELECT id, title, content
    FROM "Note"
    WHERE embedding IS NULL
    ORDER BY "createdAt" DESC
  `

  console.log(`找到 ${notes.length} 条需要向量化的笔记`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    console.log(`[${i + 1}/${notes.length}] 处理笔记: ${note.title}`)

    try {
      // 组合标题和内容
      const textToEmbed = `${note.title}\n\n${note.content}`
      
      // 生成向量（带重试机制，最多重试 3 次）
      const embedding = await generateEmbedding(textToEmbed, 3)
      
      // 保存到数据库
      await db.$executeRaw`
        UPDATE "Note"
        SET embedding = ${embedding}::vector
        WHERE id = ${note.id}
      `

      successCount++
      console.log(`  ✅ 成功`)
    } catch (error) {
      errorCount++
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`  ❌ 失败:`, errorMessage)
      
      // 如果是文本长度问题，记录详细信息
      if (errorMessage.includes("文本长度")) {
        console.error(`    笔记内容长度: ${note.content.length} 字符`)
      }
    }

    // 添加延迟，避免 API 限流
    if (i < notes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log("\n批量向量化完成！")
  console.log(`成功: ${successCount} 条`)
  console.log(`失败: ${errorCount} 条`)
}

main()
  .catch((error) => {
    console.error("批量向量化失败:", error)
    process.exit(1)
  })
  .finally(() => {
    db.$disconnect()
  })

