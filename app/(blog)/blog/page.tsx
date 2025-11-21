import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "博客 | 个人知识库 + 技术博客",
  description: "分享技术知识、经验和思考的技术博客",
  openGraph: {
    title: "博客 | 个人知识库 + 技术博客",
    description: "分享技术知识、经验和思考的技术博客",
    type: "website",
  },
}

export default async function BlogPage() {
  const posts = await db.post.findMany({
    where: { published: true },
    include: {
      category: true,
      tags: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  })


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">博客</h1>
        <p className="text-muted-foreground">分享知识和经验</p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">还没有发布任何文章</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {post.category && (
                    <span className="px-2 py-1 bg-secondary rounded">
                      {post.category.name}
                    </span>
                  )}
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <CardTitle className="hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </Link>
                {post.excerpt && (
                  <CardDescription>{post.excerpt}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.user.image && (
                      <img
                        src={post.user.image}
                        alt={post.user.name || ""}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {post.user.name || "匿名"}
                    </span>
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="ghost" size="sm">
                      阅读更多 →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

