/**
 * 告警通知系统
 * 支持邮件、Webhook 等多种通知方式
 */

import { logger } from "./logger"

export type AlertLevel = "info" | "warning" | "error" | "critical"

export interface AlertOptions {
  level: AlertLevel
  title: string
  message: string
  context?: Record<string, unknown>
  tags?: Record<string, string>
}

/**
 * 发送告警通知
 */
export async function sendAlert(options: AlertOptions) {
  const { level, title, message, context, tags } = options

  // 记录日志
  const logMessage = `Alert [${level}]: ${title} - ${message}`
  const logContext = { ...context, tags }
  if (level === "error" || level === "critical") {
    logger.error(logMessage, logContext)
  } else {
    logger.warn(logMessage, logContext)
  }

  // 发送邮件通知（如果配置了）
  if (process.env.ALERT_EMAIL_ENABLED === "true" && 
      (level === "error" || level === "critical")) {
    try {
      await sendEmailAlert(options)
    } catch (error) {
      logger.error("Failed to send email alert", error)
    }
  }

  // 发送 Webhook 通知（如果配置了）
  if (process.env.ALERT_WEBHOOK_URL && 
      (level === "error" || level === "critical")) {
    try {
      await sendWebhookAlert(options)
    } catch (error) {
      logger.error("Failed to send webhook alert", error)
    }
  }
}

/**
 * 发送邮件告警
 */
async function sendEmailAlert(options: AlertOptions) {
  const { level, title, message, context } = options
  
  // 使用 Vercel 的邮件服务或其他邮件服务
  // 这里提供一个基础实现，实际使用时需要配置邮件服务
  const emailServiceUrl = process.env.EMAIL_SERVICE_URL
  const recipientEmail = process.env.ALERT_EMAIL_RECIPIENT

  if (!emailServiceUrl || !recipientEmail) {
    logger.warn("Email alert not configured")
    return
  }

  // 构建邮件内容
  const emailBody = {
    to: recipientEmail,
    subject: `[${level.toUpperCase()}] ${title}`,
    html: `
      <h2>告警通知</h2>
      <p><strong>级别:</strong> ${level}</p>
      <p><strong>标题:</strong> ${title}</p>
      <p><strong>消息:</strong> ${message}</p>
      ${context ? `<pre>${JSON.stringify(context, null, 2)}</pre>` : ""}
      <p><small>时间: ${new Date().toISOString()}</small></p>
    `,
  }

  // 发送邮件（示例：使用 fetch API）
  try {
    const response = await fetch(emailServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`,
      },
      body: JSON.stringify(emailBody),
    })

    if (!response.ok) {
      throw new Error(`Email service returned ${response.status}`)
    }
  } catch (error) {
    logger.error("Failed to send email alert", error)
    throw error
  }
}

/**
 * 发送 Webhook 告警
 */
async function sendWebhookAlert(options: AlertOptions) {
  const { level, title, message, context, tags } = options
  const webhookUrl = process.env.ALERT_WEBHOOK_URL

  if (!webhookUrl) {
    logger.warn("Webhook alert not configured")
    return
  }

  // 构建 Webhook 负载
  const payload = {
    level,
    title,
    message,
    context,
    tags,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`)
    }
  } catch (error) {
    logger.error("Failed to send webhook alert", error)
    throw error
  }
}

/**
 * 便捷方法：发送错误告警
 */
export function alertError(title: string, message: string, error?: Error, context?: Record<string, unknown>) {
  return sendAlert({
    level: "error",
    title,
    message,
    context: {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    },
  })
}

/**
 * 便捷方法：发送关键错误告警
 */
export function alertCritical(title: string, message: string, context?: Record<string, unknown>) {
  return sendAlert({
    level: "critical",
    title,
    message,
    context,
  })
}

