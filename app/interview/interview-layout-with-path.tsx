"use client"

import { usePathname } from "next/navigation"
import { InterviewLayoutWrapper } from "@/app/interview/interview-layout-wrapper"

export function InterviewLayoutWithPath() {
  const pathname = usePathname()
  // 从路径中提取当前文件路径
  const currentPath = pathname.replace("/interview/", "").replace(".md", "")

  return <InterviewLayoutWrapper currentPath={currentPath || undefined} />
}

