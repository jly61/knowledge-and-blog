"use client"

import React, { useState, useEffect, useContext } from "react"
import Link from "next/link"
import { InterviewNode } from "@/app/actions/interview"
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react"
import { cn } from "@/lib/utils"

interface InterviewTreeProps {
  tree: InterviewNode[]
  currentPath?: string
  level?: number
}

// 使用模块级别的变量来持久化展开状态，避免路由变化时丢失
const globalExpandedPaths = new Set<string>()

// 使用 Context 来共享展开状态，避免路由变化时状态丢失
const ExpandedContext = React.createContext<{
  expandedPaths: Set<string>
  toggleExpanded: (path: string) => void
}>({
  expandedPaths: new Set(),
  toggleExpanded: () => {},
})

export function InterviewTree({
  tree,
  currentPath,
  level = 0,
}: InterviewTreeProps) {
  // 使用模块级别的全局状态来持久化展开路径
  // 初始化时，从全局状态恢复，并添加当前路径相关的展开路径
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const paths = new Set(globalExpandedPaths)
    if (currentPath) {
      const pathParts = currentPath.split("/")
      for (let i = 0; i < pathParts.length; i++) {
        const path = pathParts.slice(0, i + 1).join("/")
        paths.add(path)
      }
    }
    // 更新全局状态
    globalExpandedPaths.clear()
    paths.forEach((path) => globalExpandedPaths.add(path))
    return paths
  })

  // 当 currentPath 变化时，自动展开相关路径（但不关闭已展开的）
  useEffect(() => {
    if (currentPath) {
      setExpandedPaths((prev) => {
        const newSet = new Set(prev)
        const pathParts = currentPath.split("/")
        for (let i = 0; i < pathParts.length; i++) {
          const path = pathParts.slice(0, i + 1).join("/")
          newSet.add(path)
        }
        // 更新全局状态
        globalExpandedPaths.clear()
        newSet.forEach((path) => globalExpandedPaths.add(path))
        return newSet
      })
    }
  }, [currentPath])

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
        globalExpandedPaths.delete(path)
      } else {
        newSet.add(path)
        globalExpandedPaths.add(path)
      }
      return newSet
    })
  }

  return (
    <ExpandedContext.Provider value={{ expandedPaths, toggleExpanded }}>
      <div className="p-4">
        <nav className="space-y-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              currentPath={currentPath}
              level={level}
            />
          ))}
        </nav>
      </div>
    </ExpandedContext.Provider>
  )
}

interface TreeNodeProps {
  node: InterviewNode
  currentPath?: string
  level: number
}

// 从名称中提取显示名称（去掉排序号前缀）
function getDisplayName(name: string): string {
  const match = name.match(/^\d+-(.+)$/)
  return match ? match[1] : name
}

function TreeNode({ node, currentPath, level }: TreeNodeProps) {
  const { expandedPaths, toggleExpanded } = useContext(ExpandedContext)
  
  // 使用路径作为 key，从 Context 中获取展开状态
  const nodePathWithoutExt = node.path.replace(/\.md$/, "")
  const isExpanded = expandedPaths.has(nodePathWithoutExt)

  // 比较时移除 .md 后缀
  const isActive = currentPath === nodePathWithoutExt
  const hasChildren = node.children && node.children.length > 0
  const displayName = getDisplayName(node.name)

  if (node.type === "file") {
    // node.path 已经是完整路径，如 "JavaScript/基础/变量和类型.md"
    // 需要移除 .md 后缀，然后作为路由参数
    const pathWithoutExt = node.path.replace(/\.md$/, "")
    const href = `/interview/${pathWithoutExt}`
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={(e) => {
          // 阻止事件冒泡，避免触发父元素的展开/收起
          e.stopPropagation()
        }}
      >
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleExpanded(nodePathWithoutExt)
        }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm w-full text-left transition-colors",
          "hover:bg-muted"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Folder className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </button>
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              currentPath={currentPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

