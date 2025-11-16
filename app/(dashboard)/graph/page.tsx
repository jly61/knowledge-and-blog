import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getCategoriesForGraph, getTagsForGraph } from "@/app/actions/graph"
import { GraphClient } from "@/components/graph/graph-client"

export const dynamic = "force-dynamic"

export default async function GraphPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const [categories, tags] = await Promise.all([
    getCategoriesForGraph(),
    getTagsForGraph(),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">知识图谱</h1>
        <p className="text-muted-foreground">
          可视化你的笔记关系和知识网络
        </p>
      </div>

      <GraphClient categories={categories} tags={tags} />
    </div>
  )
}

