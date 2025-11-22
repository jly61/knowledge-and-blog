import { InterviewContent } from "@/components/interview/interview-content"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InterviewPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          面试题库
        </h1>
        <p className="text-muted-foreground mt-2">
          系统自动解析 interview 文件夹中的 Markdown 文件
        </p>
      </div>

      {/* 右侧内容 */}
      <div className="col-span-12 lg:col-span-9">
        <InterviewContent />
      </div>
    </>
  )
}

