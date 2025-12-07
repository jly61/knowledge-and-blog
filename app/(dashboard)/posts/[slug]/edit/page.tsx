import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getPostBySlugForEdit } from "@/app/actions/posts"
import { getCategoriesForGraph, getTagsForGraph } from "@/app/actions/graph"
import { PostEditor } from "@/components/posts/post-editor"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function EditPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const post = await getPostBySlugForEdit(params.slug)
  if (!post) {
    redirect("/blog")
  }

  const [categories, tags, allNotes] = await Promise.all([
    getCategoriesForGraph(),
    getTagsForGraph(),
    db.note.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
      },
    }),
  ])

  // 创建笔记标题映射，用于双向链接
  const noteTitleMap = new Map<string, string>()
  allNotes.forEach((n) => {
    noteTitleMap.set(n.title.toLowerCase(), n.id)
    noteTitleMap.set(n.title, n.id)
  })

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">编辑文章</h1>
        <p className="text-muted-foreground">
          修改文章内容和设置
        </p>
      </div>

      <PostEditor post={post} categories={categories} tags={tags} noteTitleMap={noteTitleMap} />
    </div>
  )
}

