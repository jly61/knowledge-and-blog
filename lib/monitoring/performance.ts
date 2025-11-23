/**
 * 性能监控工具
 * 用于监控 API 路由、Server Actions 等的性能
 */

import { logger } from "./logger"

/**
 * 性能监控装饰器（用于函数）
 */
export function withPerformanceMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now()
    try {
      const result = await fn(...args)
      const duration = Date.now() - startTime
      logger.performance(operationName, duration, { args: args.length })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`Performance monitoring: ${operationName} failed`, error, {
        duration,
        args: args.length,
      })
      throw error
    }
  }) as T
}

/**
 * 性能监控包装器（用于同步函数）
 */
export function measurePerformance<T>(
  operationName: string,
  fn: () => T
): T {
  const startTime = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - startTime
    logger.performance(operationName, duration)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Performance monitoring: ${operationName} failed`, error, {
      duration,
    })
    throw error
  }
}

/**
 * 异步性能监控包装器
 */
export async function measurePerformanceAsync<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    logger.performance(operationName, duration)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Performance monitoring: ${operationName} failed`, error, {
      duration,
    })
    throw error
  }
}

/**
 * 创建性能监控器
 */
export class PerformanceMonitor {
  private startTime: number
  private operationName: string

  constructor(operationName: string) {
    this.operationName = operationName
    this.startTime = Date.now()
  }

  /**
   * 结束监控并记录
   */
  end(context?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime
    logger.performance(this.operationName, duration, context)
    return duration
  }

  /**
   * 检查是否超时
   */
  checkTimeout(threshold: number) {
    const duration = Date.now() - this.startTime
    if (duration > threshold) {
      logger.warn(`Operation ${this.operationName} exceeded threshold`, {
        duration,
        threshold,
      })
    }
    return duration
  }
}

