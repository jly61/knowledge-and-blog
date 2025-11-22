import { getCurrentUser } from "@/lib/auth-server"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const [notesCount, postsCount, linksCount] = await Promise.all([
    db.note.count({ where: { userId: user.id } }),
    db.post.count({ where: { userId: user.id, published: true } }),
    db.noteLink.count({
      where: {
        fromNote: { userId: user.id },
      },
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">欢迎回来，{user.name || user.email}</h1>
        <p className="text-muted-foreground">管理你的知识库和博客</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>笔记</CardTitle>
            <CardDescription>你的知识库笔记数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notesCount}</div>
            <Link href="/notes">
              <Button variant="link" className="p-0 mt-2">
                查看所有笔记 →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已发布文章</CardTitle>
            <CardDescription>博客中的文章数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{postsCount}</div>
            <Link href="/blog">
              <Button variant="link" className="p-0 mt-2">
                查看博客 →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>链接关系</CardTitle>
            <CardDescription>笔记之间的连接数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{linksCount}</div>
            <Link href="/graph">
              <Button variant="link" className="p-0 mt-2">
                查看图谱 →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/notes/new">
              <Button className="w-full" variant="outline">
                创建新笔记
              </Button>
            </Link>
            <Link href="/graph">
              <Button className="w-full" variant="outline">
                知识图谱
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近笔记</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              最近创建的笔记将显示在这里
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

