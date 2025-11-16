"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    if (isLoading) return // 防止重复点击
    
    setIsLoading(true)
    try {
      // NextAuth v5 的 signOut 会自动调用 /api/auth/signout 端点
      // 该端点由 handlers 自动处理，不需要自定义路由
      await signOut({ 
        callbackUrl: "/",
        redirect: false  // 不自动重定向，我们手动处理
      })
      
      // 等待一下确保会话清除完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 强制刷新页面，清除所有缓存和状态
      window.location.href = "/"
    } catch (error) {
      console.error("登出失败:", error)
      // 如果失败，强制清除 cookie 并跳转
      const cookies = document.cookie.split(";")
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        // 清除 NextAuth 相关的 cookie
        if (name.includes("auth") || name.includes("session") || name.includes("token")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        }
      })
      window.location.href = "/"
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSignOut} 
      variant="ghost"
      disabled={isLoading}
    >
      {isLoading ? "退出中..." : "退出"}
    </Button>
  )
}

