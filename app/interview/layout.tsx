import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth-server"
import { InterviewLayoutWithPath } from "@/app/interview/interview-layout-with-path"

export default async function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold">
                首页
              </Link>
              <nav className="flex gap-4">
                <Link href="/blog">
                  <Button variant="ghost">博客</Button>
                </Link>
                <Link href="/interview">
                  <Button variant="ghost">面试</Button>
                </Link>
                {user && (
                  <Link href="/dashboard">
                    <Button variant="ghost">知识库</Button>
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost">知识库</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-6">
            {/* 左侧导航 - 在 layout 中渲染，保持稳定 */}
            <InterviewLayoutWithPath />
            {/* 右侧内容 - 由页面组件渲染 */}
            <div className="col-span-12 lg:col-span-9">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

