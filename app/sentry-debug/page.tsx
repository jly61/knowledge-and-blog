/**
 * Sentry 调试页面
 * 用于检查 Sentry 是否正确初始化和配置
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"

export default function SentryDebugPage() {
  const [info, setInfo] = useState<{
    dsn: string | undefined
    initialized: boolean
    client: boolean
    server: boolean
  }>({
    dsn: undefined,
    initialized: false,
    client: false,
    server: false,
  })

  useEffect(() => {
    // 检查客户端 Sentry
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    const isInitialized = !!Sentry.getClient()
    
    setInfo({
      dsn,
      initialized: isInitialized,
      client: typeof window !== "undefined",
      server: false,
    })

    // 尝试发送一个测试消息
    if (isInitialized && dsn) {
      console.log("Sentry 客户端状态:", {
        dsn: dsn.substring(0, 30) + "...",
        initialized: isInitialized,
        client: Sentry.getClient(),
      })
    }
  }, [])

  const testCapture = () => {
    try {
      Sentry.captureMessage("测试消息 - " + new Date().toISOString(), "info")
      alert("✅ 消息已发送到 Sentry")
    } catch (error) {
      console.error("发送失败:", error)
      alert("❌ 发送失败: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  const testException = () => {
    try {
      Sentry.captureException(new Error("测试异常 - " + new Date().toISOString()))
      alert("✅ 异常已发送到 Sentry")
    } catch (error) {
      console.error("发送失败:", error)
      alert("❌ 发送失败: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Sentry 调试信息</CardTitle>
          <CardDescription>检查 Sentry 的配置和初始化状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 配置信息 */}
          <div className="space-y-2">
            <h3 className="font-semibold">配置信息：</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md space-y-2 text-sm">
              <div>
                <strong>DSN:</strong>{" "}
                {info.dsn ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✅ 已配置 ({info.dsn.substring(0, 30)}...)
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">❌ 未配置</span>
                )}
              </div>
              <div>
                <strong>客户端环境:</strong>{" "}
                {info.client ? (
                  <span className="text-green-600 dark:text-green-400">✅ 是</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">❌ 否</span>
                )}
              </div>
              <div>
                <strong>Sentry 客户端已初始化:</strong>{" "}
                {info.initialized ? (
                  <span className="text-green-600 dark:text-green-400">✅ 是</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">❌ 否</span>
                )}
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="space-y-2">
            <h3 className="font-semibold">测试功能：</h3>
            <div className="flex gap-4">
              <Button onClick={testCapture} variant="default">
                发送测试消息
              </Button>
              <Button onClick={testException} variant="destructive">
                发送测试异常
              </Button>
            </div>
          </div>

          {/* 检查清单 */}
          <div className="space-y-2">
            <h3 className="font-semibold">检查清单：</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  检查浏览器控制台（F12）是否有 Sentry 初始化日志
                </li>
                <li>
                  检查 Network 标签，搜索 "sentry.io" 查看是否有请求
                </li>
                <li>
                  点击上面的测试按钮，然后检查 Sentry 仪表板
                </li>
                <li>
                  如果仍然没有请求，检查浏览器控制台是否有错误
                </li>
              </ol>
            </div>
          </div>

          {/* 环境变量检查 */}
          <div className="space-y-2">
            <h3 className="font-semibold">环境变量：</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md text-sm">
              <p className="mb-2">
                <strong>NEXT_PUBLIC_SENTRY_DSN:</strong>{" "}
                {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✅ 已设置
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    ❌ 未设置（需要在 .env.local 中配置）
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                注意：环境变量需要重启开发服务器才能生效
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

