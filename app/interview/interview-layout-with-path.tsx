"use client"

import { usePathname } from "next/navigation"
import { InterviewLayoutClient } from "@/app/interview/interview-layout-client"
import type { InterviewNode } from "@/app/actions/interview"

interface InterviewLayoutWithPathProps {
  initialTree: InterviewNode[]
}

export function InterviewLayoutWithPath({
  initialTree,
}: InterviewLayoutWithPathProps) {
  const pathname = usePathname()
  // 从路径中提取当前文件路径
  const currentPath = pathname.replace("/interview/", "").replace(".md", "")

  return (
    <InterviewLayoutClient
      initialTree={initialTree}
      currentPath={currentPath || undefined}
    />
  )
}

