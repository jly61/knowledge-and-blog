import { auth } from "@/lib/auth"

/**
 * 获取服务端会话
 * NextAuth v5 使用 auth() 函数
 */
export async function getSession() {
  return await auth()
}

/**
 * 获取当前用户（服务端）
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

