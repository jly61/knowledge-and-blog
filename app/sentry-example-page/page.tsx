/**
 * Sentry 测试页面
 * 用于验证 Sentry 错误捕获是否正常工作
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as Sentry from "@sentry/nextjs"

export default function SentryExamplePage() {
  const [errorTriggered, setErrorTriggered] = useState(false)

  // 触发客户端错误
  const triggerClientError = () => {
    try {
      // 调用不存在的函数
      ;(window as any).nonExistentFunction()
    } catch (error) {
      // 手动捕获并发送到 Sentry
      Sentry.captureException(error)
      setErrorTriggered(true)
    }
  }

  // 触发未捕获的错误
  const triggerUncaughtError = () => {
    // 这会触发一个未捕获的错误
    throw new Error("这是一个测试错误 - Sentry 应该捕获它")
  }

  // 发送自定义消息
  const sendCustomMessage = () => {
    Sentry.captureMessage("这是一条测试消息", "info")
    setErrorTriggered(true)
  }

  // 触发异步错误
  const triggerAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("异步错误测试"))
        }, 100)
      })
    } catch (error) {
      Sentry.captureException(error)
      setErrorTriggered(true)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sentry 错误测试页面</CardTitle>
          <CardDescription>
            点击下面的按钮来触发不同类型的错误，验证 Sentry 是否正常工作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">测试选项：</h3>
            
            <div className="grid gap-4">
              <Button onClick={triggerClientError} variant="default">
                1. 触发客户端错误（已捕获）
              </Button>
              
              <Button onClick={triggerUncaughtError} variant="destructive">
                2. 触发未捕获的错误
              </Button>
              
              <Button onClick={sendCustomMessage} variant="outline">
                3. 发送自定义消息
              </Button>
              
              <Button onClick={triggerAsyncError} variant="secondary">
                4. 触发异步错误
              </Button>
            </div>
          </div>

          {errorTriggered && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ 错误已触发！请检查 Sentry 仪表板查看是否收到错误报告。
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              验证步骤：
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>点击上面的任意按钮触发错误</li>
              <li>等待几秒钟让错误发送到 Sentry</li>
              <li>在 Sentry 仪表板中查看 "Issues" 页面</li>
              <li>你应该能看到新创建的错误报告</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 提示：如果错误没有出现在 Sentry 中，请检查：
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>环境变量 <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">NEXT_PUBLIC_SENTRY_DSN</code> 是否正确配置</li>
              <li>浏览器控制台是否有 Sentry 相关的错误信息</li>
              <li>网络请求是否成功发送到 Sentry（查看 Network 标签）</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

