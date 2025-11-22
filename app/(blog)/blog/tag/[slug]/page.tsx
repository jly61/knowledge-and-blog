import { getPostsByTagSlug } from "@/app/actions/posts"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const result = await getPostsByTagSlug(params.slug)

  if (!result) {
    return {
      title: "标签未找到",
    }
  }

  return {
    title: `#${result.tag.name} | 博客标签`,
    description: `查看标签 ${result.tag.name} 下的所有文章`,
  }
}

export default async function TagPage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await getPostsByTagSlug(params.slug)

  if (!result) {
    notFound()
  }

  const { tag, posts } = result

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            博客
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">标签</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">#{tag.name}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          #{tag.name}
          {tag.color && (
            <span
              className="inline-block w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          共 {posts.length} 篇文章
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              该标签下还没有文章
            </p>
            <Link href="/blog">
              <Button variant="outline">返回博客首页</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {post.category && (
                    <Link href={`/blog/category/${post.category.slug}`}>
                      <span className="px-2 py-1 bg-secondary rounded text-xs hover:bg-secondary/80">
                        {post.category.name}
                      </span>
                    </Link>
                  )}
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                  {post.tags.length > 1 && (
                    <>
                      <span>•</span>
                      <div className="flex gap-1">
                        {post.tags
                          .filter((t) => t.id !== tag.id)
                          .slice(0, 2)
                          .map((t) => (
                            <Link key={t.id} href={`/blog/tag/${t.slug}`}>
                              <span className="px-2 py-1 bg-secondary rounded text-xs hover:bg-secondary/80">
                                #{t.name}
                              </span>
                            </Link>
                          ))}
                      </div>
                    </>
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

