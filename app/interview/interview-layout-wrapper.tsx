import { getInterviewTree } from "@/app/actions/interview"
import { InterviewLayoutClient } from "@/app/interview/interview-layout-client"
import { cache } from "react"

// 缓存树形结构
const getCachedTree = cache(async () => {
  return await getInterviewTree()
})

interface InterviewLayoutWrapperProps {
  currentPath?: string
}

export async function InterviewLayoutWrapper({
  currentPath,
}: InterviewLayoutWrapperProps) {
  const tree = await getCachedTree()

  return <InterviewLayoutClient initialTree={tree} currentPath={currentPath} />
}
