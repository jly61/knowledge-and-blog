import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getTagsWithStats } from "@/app/actions/tags"
import { TagsClient } from "@/components/tags/tags-client"

export const dynamic = "force-dynamic"

export default async function TagsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const tags = await getTagsWithStats()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">标签管理</h1>
        <p className="text-muted-foreground">
          管理你的笔记和文章标签
        </p>
      </div>

      <TagsClient initialTags={tags} />
    </div>
  )
}

