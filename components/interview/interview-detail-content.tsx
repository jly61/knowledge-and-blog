import { getInterviewFile } from "@/app/actions/interview"
import { extractTableOfContents } from "@/lib/markdown/extractToc"
import { InterviewContent } from "@/components/interview/interview-content"
import { InterviewTOC } from "@/components/interview/interview-toc"

interface InterviewDetailContentProps {
  filePath: string
}

export async function InterviewDetailContent({ filePath }: InterviewDetailContentProps) {
  const content = await getInterviewFile(filePath)

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">文件不存在</p>
      </div>
    )
  }

  const toc = extractTableOfContents(content)

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <InterviewContent content={content} toc={toc} />
      </div>
      <div className="col-span-12 lg:col-span-4">
        <InterviewTOC toc={toc} />
      </div>
    </div>
  )
}

