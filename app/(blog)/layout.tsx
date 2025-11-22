import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth-server"

export default async function BlogLayout({
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
            <Link href="/blog" className="text-xl font-bold">
              博客
            </Link>
            <nav className="flex gap-4">
              <Link href="/">
                <Button variant="ghost">首页</Button>
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost">知识库</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

