import { getInterviewTree } from "@/app/actions/interview"
import { InterviewTree } from "@/components/interview/interview-tree"
import { InterviewContent } from "@/components/interview/interview-content"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InterviewPage() {
  const tree = await getInterviewTree()

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          面试题库
        </h1>
        <p className="text-muted-foreground mt-2">
          系统自动解析 interview 文件夹中的 Markdown 文件
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧导航 */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
            <InterviewTree tree={tree} />
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="col-span-12 lg:col-span-9">
          <InterviewContent />
        </div>
      </div>
    </div>
  )
}

