/**
 * AI 调用限流工具
 * 
 * 防止 DeepSeek/OpenAI API 被滥用，限制：
 * 1. 每次请求的最大 token 数（输入+输出）
 * 2. 每小时/每天的调用次数
 * 3. 基于用户 ID 的限流
 */

import { auth } from "@/lib/auth"

/**
 * 限流配置
 */
export interface RateLimitConfig {
  /** 每次请求的最大输入 token 数 */
  maxInputTokensPerRequest: number
  /** 每次请求的最大输出 token 数 */
  maxOutputTokensPerRequest: number
  /** 每小时最大调用次数 */
  maxCallsPerHour: number
  /** 每天最大调用次数 */
  maxCallsPerDay: number
  /** 是否启用限流（默认启用） */
  enabled: boolean
}

/**
 * 默认限流配置
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxInputTokensPerRequest: parseInt(
    process.env.AI_MAX_INPUT_TOKENS_PER_REQUEST || "4000",
    10
  ),
  maxOutputTokensPerRequest: parseInt(
    process.env.AI_MAX_OUTPUT_TOKENS_PER_REQUEST || "2000",
    10
  ),
  maxCallsPerHour: parseInt(
    process.env.AI_MAX_CALLS_PER_HOUR || "50",
    10
  ),
  maxCallsPerDay: parseInt(
    process.env.AI_MAX_CALLS_PER_DAY || "200",
    10
  ),
  enabled: process.env.AI_RATE_LIMIT_ENABLED !== "false",
}

/**
 * 使用记录（内存缓存）
 * 在生产环境中，建议使用 Redis 或数据库
 */
interface UsageRecord {
  userId: string | null
  timestamp: number
  inputTokens: number
  outputTokens: number
}

class RateLimiter {
  private records: UsageRecord[] = []
  private config: RateLimitConfig

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    // 定期清理过期记录（每小时清理一次）
    setInterval(() => this.cleanup(), 60 * 60 * 1000)
  }

  /**
   * 清理过期记录（保留最近 24 小时的记录）
   */
  private cleanup() {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    this.records = this.records.filter((r) => r.timestamp > oneDayAgo)
  }

  /**
   * 估算文本的 token 数（简单估算：中文 1.5 字符/token，英文 4 字符/token）
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文字符数 * 1.5 + 英文字符数 / 4
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishChars = text.length - chineseChars
    return Math.ceil(chineseChars * 1.5 + englishChars / 4)
  }

  /**
   * 检查是否超过限制
   */
  async checkLimit(
    userId: string | null,
    inputText: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 如果限流未启用，直接允许
    if (!this.config.enabled) {
      return { allowed: true }
    }

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    // 获取该用户的记录
    const userRecords = this.records.filter(
      (r) => r.userId === userId || (userId === null && r.userId === null)
    )

    // 估算输入 token 数
    const inputTokens = this.estimateTokens(inputText)

    // 检查每次请求的 token 限制
    if (inputTokens > this.config.maxInputTokensPerRequest) {
      return {
        allowed: false,
        reason: `输入文本过长，超过单次请求限制（${this.config.maxInputTokensPerRequest} tokens）。当前：${inputTokens} tokens`,
      }
    }

    // 检查每小时调用次数
    const hourlyCalls = userRecords.filter(
      (r) => r.timestamp > oneHourAgo
    ).length
    if (hourlyCalls >= this.config.maxCallsPerHour) {
      return {
        allowed: false,
        reason: `每小时调用次数已达上限（${this.config.maxCallsPerHour} 次）。请稍后再试。`,
      }
    }

    // 检查每天调用次数
    const dailyCalls = userRecords.filter(
      (r) => r.timestamp > oneDayAgo
    ).length
    if (dailyCalls >= this.config.maxCallsPerDay) {
      return {
        allowed: false,
        reason: `每天调用次数已达上限（${this.config.maxCallsPerDay} 次）。请明天再试。`,
      }
    }

    return { allowed: true }
  }

  /**
   * 记录使用情况
   */
  recordUsage(
    userId: string | null,
    inputText: string,
    outputText?: string
  ): void {
    const inputTokens = this.estimateTokens(inputText)
    const outputTokens = outputText
      ? this.estimateTokens(outputText)
      : this.config.maxOutputTokensPerRequest // 如果没有输出文本，使用最大可能值

    this.records.push({
      userId,
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
    })
  }

  /**
   * 获取用户使用统计
   */
  getUsageStats(userId: string | null): {
    hourlyCalls: number
    dailyCalls: number
    remainingHourlyCalls: number
    remainingDailyCalls: number
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const userRecords = this.records.filter(
      (r) => r.userId === userId || (userId === null && r.userId === null)
    )

    const hourlyCalls = userRecords.filter(
      (r) => r.timestamp > oneHourAgo
    ).length
    const dailyCalls = userRecords.filter(
      (r) => r.timestamp > oneDayAgo
    ).length

    return {
      hourlyCalls,
      dailyCalls,
      remainingHourlyCalls: Math.max(
        0,
        this.config.maxCallsPerHour - hourlyCalls
      ),
      remainingDailyCalls: Math.max(
        0,
        this.config.maxCallsPerDay - dailyCalls
      ),
    }
  }
}

// 单例实例
let rateLimiterInstance: RateLimiter | null = null

/**
 * 获取限流器实例
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}

/**
 * 检查并应用限流（用于 API 路由）
 * 
 * @param inputText - 输入文本
 * @returns 如果允许，返回 null；如果拒绝，返回错误响应
 */
export async function checkRateLimit(
  inputText: string
): Promise<Response | null> {
  const session = await auth()
  const userId = session?.user?.id || null

  const limiter = getRateLimiter()
  const check = await limiter.checkLimit(userId, inputText)

  if (!check.allowed) {
    return new Response(
      JSON.stringify({
        error: check.reason || "调用次数已达上限",
      }),
      {
        status: 429, // Too Many Requests
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return null
}

/**
 * 记录 API 使用情况
 */
export function recordApiUsage(inputText: string, outputText?: string): void {
  // 异步记录，不阻塞响应
  Promise.resolve().then(async () => {
    const session = await auth()
    const userId = session?.user?.id || null
    const limiter = getRateLimiter()
    limiter.recordUsage(userId, inputText, outputText)
  })
}



