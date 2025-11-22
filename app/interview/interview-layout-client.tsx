"use client"

import { InterviewTree } from "@/components/interview/interview-tree"
import { Card } from "@/components/ui/card"
import { useMemo } from "react"
import type { InterviewNode } from "@/app/actions/interview"

interface InterviewLayoutClientProps {
  initialTree: InterviewNode[]
  currentPath?: string
}

export function InterviewLayoutClient({
  initialTree,
  currentPath,
}: InterviewLayoutClientProps) {
  // 使用 useMemo 保持树形结构稳定，避免不必要的重新渲染
  const tree = useMemo(() => initialTree, [initialTree])

  return (
    <div className="col-span-12 lg:col-span-3">
      <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
        <InterviewTree tree={tree} currentPath={currentPath} />
      </Card>
    </div>
  )
}

