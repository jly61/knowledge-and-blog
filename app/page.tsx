import Link from "next/link"
import { getCurrentUser } from "@/lib/auth-server"
import { Button } from "@/components/ui/button"

// 禁用缓存，确保每次请求都重新获取会话
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">知识库 + 博客</h1>
          <nav className="flex gap-4">
            <Link href="/blog">
              <Button variant="ghost">博客</Button>
            </Link>
            <Link href="/interview">
              <Button variant="ghost">面试</Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost">知识库</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">登录</Button>
                </Link>
                <Link href="/register">
                  <Button>注册</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            个人知识库 + 技术博客
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            一个集成了个人知识库管理和技术博客发布的全栈应用系统
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg">进入仪表板</Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg">开始使用</Button>
                </Link>
                <Link href="/blog">
                  <Button size="lg" variant="outline">
                    查看博客
                  </Button>
                </Link>
                <Link href="/interview">
                  <Button size="lg" variant="outline">
                    面试题库
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📝 知识库</h3>
            <p className="text-muted-foreground">
              使用双向链接构建你的知识网络，通过知识图谱可视化你的思维连接
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">📰 博客</h3>
            <p className="text-muted-foreground">
              将你的笔记一键发布为博客文章，分享你的知识和经验
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

