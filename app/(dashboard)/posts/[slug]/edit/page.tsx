import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getPostBySlugForEdit } from "@/app/actions/posts"
import { getCategoriesForGraph, getTagsForGraph } from "@/app/actions/graph"
import { PostEditor } from "@/components/posts/post-editor"

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

  const [categories, tags] = await Promise.all([
    getCategoriesForGraph(),
    getTagsForGraph(),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">编辑文章</h1>
        <p className="text-muted-foreground">
          修改文章内容和设置
        </p>
      </div>

      <PostEditor post={post} categories={categories} tags={tags} />
    </div>
  )
}

