/**
 * Sentry 服务端错误测试 API
 * 用于测试服务端错误捕获
 */

import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // 触发一个服务端错误
    throw new Error("这是一个服务端测试错误 - Sentry 应该捕获它")
  } catch (error) {
    // 捕获并发送到 Sentry
    Sentry.captureException(error)
    
    return NextResponse.json(
      {
        success: false,
        message: "服务端错误已触发并发送到 Sentry",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // 触发一个异步错误
    await new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("异步服务端错误测试"))
      }, 100)
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      {
        success: false,
        message: "异步错误已触发并发送到 Sentry",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

