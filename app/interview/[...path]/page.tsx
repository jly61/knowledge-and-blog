import { getInterviewFile, getInterviewTree } from "@/app/actions/interview"
import { extractTableOfContents } from "@/lib/markdown/extractToc"
import { InterviewTree } from "@/components/interview/interview-tree"
import { InterviewContent } from "@/components/interview/interview-content"
import { InterviewTOC } from "@/components/interview/interview-toc"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function InterviewDetailPage({
  params,
}: {
  params: { path: string[] }
}) {
  // URL 解码路径参数（处理中文字符）
  const decodedPath = params.path.map((segment) => decodeURIComponent(segment)).join("/")
  const filePath = decodedPath + ".md"
  const content = await getInterviewFile(filePath)

  if (!content) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">文件不存在</p>
        </div>
      </div>
    )
  }

  const tree = await getInterviewTree()
  const toc = extractTableOfContents(content)

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          面试题库
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧导航 */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
            <InterviewTree tree={tree} currentPath={filePath.replace(".md", "")} />
          </Card>
        </div>

        {/* 右侧内容 */}
        <div className="col-span-12 lg:col-span-6">
          <InterviewContent content={content} toc={toc} />
        </div>

        {/* 右侧目录 */}
        <div className="col-span-12 lg:col-span-3">
          <InterviewTOC toc={toc} />
        </div>
      </div>
    </div>
  )
}

