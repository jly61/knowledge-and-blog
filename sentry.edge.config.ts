/**
 * Sentry Edge 配置
 * 用于捕获 Edge Runtime 中的错误
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 环境标识
  environment: process.env.NODE_ENV || "development",
  
  // 性能监控
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 错误采样率
  sampleRate: 1.0,
  
  // 启用调试模式（仅开发环境）
  debug: process.env.NODE_ENV === "development",
  
  // 在发送前修改事件
  beforeSend(event, hint) {
    return event
  },
})

