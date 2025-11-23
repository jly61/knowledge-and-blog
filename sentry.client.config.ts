/**
 * Sentry 客户端配置
 * 用于捕获浏览器端的错误和性能数据
 */

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    
    // 环境标识
    environment: process.env.NODE_ENV || "development",
    
    // 性能监控
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 生产环境采样 10%
    
    // 错误采样率
    sampleRate: 1.0,
    
    // 启用调试模式（仅开发环境）
    debug: process.env.NODE_ENV === "development",
    
    // 忽略的错误
    ignoreErrors: [
      // 浏览器扩展相关错误
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // 网络错误（可选）
      "NetworkError",
      "Failed to fetch",
    ],
    
    // 在发送前修改事件
    beforeSend(event, hint) {
      return event
    },
    
    // 集成配置
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // 隐藏所有文本（隐私保护）
        blockAllMedia: true, // 隐藏所有媒体
      }),
    ],
    
    // 会话重放配置
    replaysSessionSampleRate: 0.1, // 10% 的会话录制
    replaysOnErrorSampleRate: 1.0, // 错误时 100% 录制
  })
}
