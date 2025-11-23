/**
 * Next.js Instrumentation Hook
 * 用于在服务器启动时初始化监控工具
 */

export async function register() {
  // 仅在服务器端运行
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 导入服务端配置（这会自动初始化 Sentry）
    await import("@/sentry.server.config").catch(() => {
      // 静默失败，不影响应用运行
    })
  }
}

