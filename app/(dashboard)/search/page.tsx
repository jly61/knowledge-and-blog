import { Suspense } from "react"
import { SearchClient } from "@/components/search/search-client"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">搜索笔记</h1>
        <p className="text-muted-foreground">
          搜索你的笔记内容、标题、标签和分类
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">加载中...</p>
            </CardContent>
          </Card>
        }
      >
        <SearchClient />
      </Suspense>
    </div>
  )
}

