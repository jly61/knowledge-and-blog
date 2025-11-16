import { getPostBySlug } from "@/app/actions/posts"
import { getCurrentUser } from "@/lib/auth-server"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { NoteContent } from "@/components/notes/note-content"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PostDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // 检查当前用户是否是文章作者
  const user = await getCurrentUser()
  const isAuthor = user && user.id === post.user.id

  // 创建笔记标题映射（用于双向链接）
  const noteTitleMap = new Map<string, string>()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isAuthor && (
        <div className="mb-4 flex justify-end">
          <Link href={`/posts/${post.slug}/edit`}>
            <Button variant="outline" size="sm">
              编辑文章
            </Button>
          </Link>
        </div>
      )}
      <article className="space-y-6">
        {/* 文章头部 */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {post.category && (
              <Link href={`/blog/category/${post.category.slug}`}>
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-medium border border-primary/20 hover:bg-primary/20 transition-colors">
                  {post.category.name}
                </span>
              </Link>
            )}
            {post.tags.map((tag: { id: string; name: string; slug: string }) => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <span className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/80 transition-colors">
                  #{tag.name}
                </span>
              </Link>
            ))}
            <span className="ml-auto">
              {post.publishedAt && formatDate(post.publishedAt)}
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              {post.user.image && (
                <img
                  src={post.user.image}
                  alt={post.user.name || ""}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">{post.user.name || "匿名"}</div>
                <div className="text-sm text-muted-foreground">
                  {post.views} 次阅读
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 文章内容 */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 px-6 pb-6">
            <NoteContent content={post.content} noteTitleMap={noteTitleMap} />
          </CardContent>
        </Card>

        {/* 文章底部信息 */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span>发布于 {post.publishedAt && formatDate(post.publishedAt)}</span>
                {post.updatedAt && post.updatedAt.getTime() !== post.createdAt.getTime() && (
                  <span className="ml-4">
                    更新于 {formatDate(post.updatedAt)}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {post.views} 次阅读
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 关联笔记（如果存在） */}
        {post.note && (
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold">关联笔记</h3>
            </CardHeader>
            <CardContent>
              <Link
                href={`/notes/${post.note.id}`}
                className="text-primary hover:underline font-medium"
              >
                {post.note.title} →
              </Link>
            </CardContent>
          </Card>
        )}
      </article>
    </div>
  )
}

