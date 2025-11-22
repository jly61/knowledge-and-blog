"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getCurrentUser } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"

/**
 * 上传图片
 */
export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("未授权")
  }

  const file = formData.get("file") as File
  if (!file) {
    throw new Error("未选择文件")
  }

  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    throw new Error("只能上传图片文件")
  }

  // 验证文件大小（最大 5MB）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error("图片大小不能超过 5MB")
  }

  // 生成唯一文件名
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split(".").pop() || "jpg"
  const fileName = `${timestamp}-${randomStr}.${extension}`

  // 创建上传目录（如果不存在）
  const uploadDir = join(process.cwd(), "public", "uploads")
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (error) {
    // 目录可能已存在，忽略错误
  }

  // 保存文件
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filePath = join(uploadDir, fileName)

  await writeFile(filePath, buffer)

  // 返回可访问的 URL
  const url = `/uploads/${fileName}`

  return { url }
}

