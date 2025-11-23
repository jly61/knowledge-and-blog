/**
 * Sentry 服务端配置
 * 用于捕获服务器端的错误和性能数据
 */

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    
    // 环境标识
    environment: process.env.NODE_ENV || "development",
    
    // 性能监控
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // 错误采样率
    sampleRate: 1.0,
    
    // 启用调试模式（仅开发环境）
    debug: process.env.NODE_ENV === "development",
    
    // 忽略的错误
    ignoreErrors: [
      // Prisma 相关错误（可选，根据需求决定）
      // "PrismaClientKnownRequestError",
    ],
    
    // 在发送前修改事件
    beforeSend(event, hint) {
      // 过滤敏感信息
      if (event.request) {
        // 移除敏感请求头
        if (event.request.headers) {
          delete event.request.headers["authorization"]
          delete event.request.headers["cookie"]
        }
      }
      
      return event
    },
    
    // 集成配置
    integrations: [
      Sentry.prismaIntegration(),
    ],
  })
}
