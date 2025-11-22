import { getPostsByCategorySlug } from "@/app/actions/posts"
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
  const result = await getPostsByCategorySlug(params.slug)

  if (!result) {
    return {
      title: "分类未找到",
    }
  }

  return {
    title: `${result.category.name} | 博客分类`,
    description: `查看 ${result.category.name} 分类下的所有文章`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await getPostsByCategorySlug(params.slug)

  if (!result) {
    notFound()
  }

  const { category, posts } = result

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            博客
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">分类</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{category.name}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {category.name}
          {category.color && (
            <span
              className="ml-3 inline-block w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          )}
        </h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          共 {posts.length} 篇文章
        </p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              该分类下还没有文章
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
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                  {post.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                            <span className="px-2 py-1 bg-secondary rounded text-xs hover:bg-secondary/80">
                              #{tag.name}
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

