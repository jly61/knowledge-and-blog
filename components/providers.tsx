"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  )

  return (
    <SessionProvider
      // 减少会话轮询频率，避免退出时多次请求
      refetchInterval={5 * 60} // 5 分钟轮询一次（而不是默认的频繁轮询）
      refetchOnWindowFocus={false} // 窗口聚焦时不自动刷新
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}

