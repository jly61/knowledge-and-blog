import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SentryInit } from "@/components/sentry-init"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "个人知识库 + 技术博客",
    template: "%s | 个人知识库 + 技术博客",
  },
  description: "集成了个人知识库管理和技术博客发布的全栈应用系统",
  keywords: ["知识库", "博客", "技术博客", "笔记", "双向链接", "知识图谱"],
  authors: [{ name: "知识库作者" }],
  creator: "知识库作者",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "个人知识库 + 技术博客",
    title: "个人知识库 + 技术博客",
    description: "集成了个人知识库管理和技术博客发布的全栈应用系统",
  },
  twitter: {
    card: "summary_large_image",
    title: "个人知识库 + 技术博客",
    description: "集成了个人知识库管理和技术博客发布的全栈应用系统",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <SentryInit />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

