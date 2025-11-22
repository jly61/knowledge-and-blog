"use server"

import { readdir, readFile, stat } from "fs/promises"
import { join } from "path"
import { extractTableOfContents } from "@/lib/markdown/extractToc"

export interface InterviewNode {
  name: string
  path: string
  type: "folder" | "file"
  children?: InterviewNode[]
  content?: string
}

/**
 * 从名称中提取排序号
 * 支持格式：01-xxx、1-xxx、02-xxx 等
 * 返回 { order: number | null, displayName: string }
 */
function extractOrder(name: string): { order: number | null; displayName: string } {
  const match = name.match(/^(\d+)-(.+)$/)
  if (match) {
    return {
      order: parseInt(match[1], 10),
      displayName: match[2],
    }
  }
  return {
    order: null,
    displayName: name,
  }
}

/**
 * 排序函数：按排序号排序
 */
function sortByOrder(a: InterviewNode, b: InterviewNode): number {
  // 文件夹在前，文件在后
  if (a.type !== b.type) {
    return a.type === "folder" ? -1 : 1
  }

  const aOrder = extractOrder(a.name)
  const bOrder = extractOrder(b.name)

  // 都有排序号：按数字大小排序
  if (aOrder.order !== null && bOrder.order !== null) {
    return aOrder.order - bOrder.order
  }

  // 一个有排序号：有排序号的优先
  if (aOrder.order !== null && bOrder.order === null) {
    return -1
  }
  if (aOrder.order === null && bOrder.order !== null) {
    return 1
  }

  // 都没有排序号：保持文件系统读取顺序（返回 0，不改变顺序）
  return 0
}

/**
 * 递归读取目录结构
 */
async function readDirectory(dirPath: string, basePath: string = ""): Promise<InterviewNode[]> {
  const items: InterviewNode[] = []
  const entries = await readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    // 跳过隐藏文件和 README.md
    if (entry.name.startsWith(".") || entry.name === "README.md") {
      continue
    }

    const fullPath = join(dirPath, entry.name)
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const children = await readDirectory(fullPath, relativePath)
      items.push({
        name: entry.name,
        path: relativePath,
        type: "folder",
        children,
      })
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      items.push({
        name: entry.name.replace(".md", ""),
        path: relativePath,
        type: "file",
      })
    }
  }

  // 按排序号排序
  return items.sort(sortByOrder)
}

/**
 * 获取面试题库目录树
 */
export async function getInterviewTree(): Promise<InterviewNode[]> {
  const interviewDir = join(process.cwd(), "interview")

  try {
    const tree = await readDirectory(interviewDir)
    return tree
  } catch (error) {
    console.error("读取面试题库目录失败:", error)
    return []
  }
}

/**
 * 获取面试题文件内容
 */
export async function getInterviewFile(filePath: string): Promise<string | null> {
  const interviewDir = join(process.cwd(), "interview")
  const fullPath = join(interviewDir, filePath)

  try {
    // 安全检查：确保路径在 interview 目录内
    // 使用 resolve 来规范化路径，避免路径遍历攻击
    const resolvedPath = join(interviewDir, filePath)
    const resolvedDir = interviewDir
    
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new Error("无效的文件路径")
    }

    const fileStat = await stat(fullPath)
    if (!fileStat.isFile() || !filePath.endsWith(".md")) {
      throw new Error("不是有效的 Markdown 文件")
    }

    const content = await readFile(fullPath, "utf-8")
    return content
  } catch (error) {
    console.error("读取面试题文件失败:", error)
    if (error instanceof Error) {
      console.error("错误详情:", error.message, "文件路径:", filePath)
    }
    return null
  }
}

// extractTableOfContents 已移至 lib/markdown/extractToc.ts
