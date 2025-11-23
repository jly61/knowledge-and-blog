/**
 * 健康检查端点
 * 用于监控系统状态
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/monitoring/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: "ok" | "error"; message?: string; duration?: number }> = {}

  // 检查数据库连接
  try {
    const dbStartTime = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = {
      status: "ok",
      duration: Date.now() - dbStartTime,
    }
  } catch (error) {
    logger.error("Health check: Database connection failed", error)
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // 检查环境变量
  const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET"]
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])
  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: "error",
      message: `Missing environment variables: ${missingEnvVars.join(", ")}`,
    }
  } else {
    checks.environment = {
      status: "ok",
    }
  }

  const totalDuration = Date.now() - startTime
  const allHealthy = Object.values(checks).every((check) => check.status === "ok")

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
    }
  )
}

