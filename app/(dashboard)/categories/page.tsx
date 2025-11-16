import { getCurrentUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { getCategoriesWithStats } from "@/app/actions/categories"
import { CategoriesClient } from "@/components/categories/categories-client"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const categories = await getCategoriesWithStats()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">分类管理</h1>
        <p className="text-muted-foreground">
          管理你的笔记和文章分类
        </p>
      </div>

      <CategoriesClient initialCategories={categories} />
    </div>
  )
}

