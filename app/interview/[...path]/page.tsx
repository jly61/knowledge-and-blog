import { InterviewDetailContent } from "@/components/interview/interview-detail-content"
import { Suspense } from "react"
import { InterviewContentSkeleton } from "@/components/loading/interview-content-skeleton"

export const dynamic = "force-dynamic"

export default async function InterviewDetailPage({
  params,
}: {
  params: { path: string[] }
}) {
  // URL 解码路径参数（处理中文字符）
  const decodedPath = params.path.map((segment) => decodeURIComponent(segment)).join("/")
  const filePath = decodedPath + ".md"

  return (
    <>
      {/* 右侧内容和目录 - 使用 Suspense 显示加载状态 */}
      <Suspense fallback={<InterviewContentSkeleton />}>
        <InterviewDetailContent filePath={filePath} />
      </Suspense>
    </>
  )
}

