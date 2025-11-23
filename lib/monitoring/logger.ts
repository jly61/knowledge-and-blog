/**
 * 自定义日志系统
 * 提供统一的日志接口，支持不同级别的日志记录
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private isServer = typeof window === "undefined"

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    // 开发环境：输出到控制台
    if (this.isDevelopment) {
      const logMethod = level === "error" ? console.error : 
                       level === "warn" ? console.warn :
                       level === "debug" ? console.debug : 
                       console.log
      
      if (context) {
        logMethod(`${prefix} ${message}`, context)
      } else {
        logMethod(`${prefix} ${message}`)
      }
    }
    
    // 生产环境：发送到 Sentry（仅错误和警告）
    // 注意：Sentry 的初始化应该在 instrumentation.ts 中完成
    // 这里只记录日志，不直接导入 Sentry 以避免构建警告
    if (!this.isDevelopment && (level === "error" || level === "warn")) {
      // 在生产环境中，Sentry 会自动捕获未处理的错误
      // 这里只需要记录日志即可
      // 如果需要主动发送到 Sentry，可以使用全局的 Sentry 对象（如果已初始化）
      if (typeof window !== "undefined" && (window as any).Sentry) {
        // 客户端：使用全局 Sentry 对象
        const Sentry = (window as any).Sentry
        if (level === "error") {
          Sentry.captureException(new Error(message), {
            level: "error",
            extra: context,
          })
        } else {
          Sentry.captureMessage(message, {
            level: "warning",
            extra: context,
          })
        }
      } else if (this.isServer && (global as any).Sentry) {
        // 服务端：使用全局 Sentry 对象
        const Sentry = (global as any).Sentry
        if (level === "error") {
          Sentry.captureException(new Error(message), {
            level: "error",
            extra: context,
          })
        } else {
          Sentry.captureMessage(message, {
            level: "warning",
            extra: context,
          })
        }
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("debug", message, context)
    }
  }

  /**
   * 信息日志
   */
  info(message: string, context?: LogContext) {
    this.log("info", message, context)
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      } : error ? { error } : {}),
    }
    this.log("error", message, errorContext)
  }

  /**
   * 性能监控
   */
  performance(operation: string, duration: number, context?: LogContext) {
    const message = `Performance: ${operation} took ${duration}ms`
    this.log("info", message, { ...context, duration, operation })
    
    // 如果操作耗时过长，记录警告
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operation}`, { duration, ...context })
    }
  }
}

export const logger = new Logger()

