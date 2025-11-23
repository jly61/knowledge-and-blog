/**
 * Sentry 客户端初始化组件
 * 确保 Sentry 在客户端正确初始化
 */

"use client"

import { useEffect } from "react"

export function SentryInit() {
  useEffect(() => {
    // 动态导入 Sentry 客户端配置
    import("@/sentry.client.config").catch(() => {
      // 静默失败，不影响应用运行
    })
  }, [])

  return null
}

