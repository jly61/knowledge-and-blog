"use client"

import { useState, useEffect, useRef } from "react"
import { Network } from "vis-network"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { getGraphData, type GraphData } from "@/app/actions/graph"
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface GraphClientProps {
  categories: Array<{ id: string; name: string; color?: string | null }>
  tags: Array<{ id: string; name: string; color?: string | null }>
}

export function GraphClient({ categories, tags }: GraphClientProps) {
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstanceRef = useRef<Network | null>(null)
  const router = useRouter()
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [categoryId, setCategoryId] = useState<string>("all")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // 加载图谱数据
  const loadGraphData = async () => {
    setIsLoading(true)
    try {
      const data = await getGraphData({
        categoryId: categoryId === "all" ? undefined : categoryId,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
      setGraphData(data)
    } catch (error) {
      console.error("加载图谱数据失败:", error)
      toast.error("加载图谱数据失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    loadGraphData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, selectedTagIds])

  // 初始化网络图
  useEffect(() => {
    if (!graphData || !networkRef.current) return

    const nodes = graphData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      title: node.title,
      color: {
        background: node.color || "#3b82f6",
        border: node.color || "#3b82f6",
        highlight: {
          background: node.color || "#3b82f6",
          border: "#000",
        },
      },
      size: node.size || 20,
      font: {
        size: 14,
        color: "#333",
      },
      shape: "dot",
    }))

    const edges = graphData.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 1,
        },
      },
      color: {
        color: "#94a3b8",
        highlight: "#3b82f6",
      },
      width: 2,
    }))

    const data = { nodes, edges }

    const options = {
      nodes: {
        shape: "dot",
        font: {
          size: 14,
          color: "#333",
        },
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 2,
        color: {
          color: "#94a3b8",
          highlight: "#3b82f6",
        },
        smooth: {
          type: "continuous",
        },
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 200,
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.1,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
    }

    const network = new Network(networkRef.current, data, options)

    // 节点点击事件
    network.on("click", (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string
        router.push(`/notes/${nodeId}`)
      }
    })

    // 节点悬停显示信息
    network.on("hoverNode", () => {
      if (networkRef.current) {
        networkRef.current.style.cursor = "pointer"
      }
    })

    network.on("blurNode", () => {
      if (networkRef.current) {
        networkRef.current.style.cursor = "default"
      }
    })

    networkInstanceRef.current = network

    return () => {
      network.destroy()
    }
  }, [graphData, router])

  const handleZoomIn = () => {
    if (networkInstanceRef.current) {
      const scale = networkInstanceRef.current.getScale()
      networkInstanceRef.current.moveTo({
        scale: scale * 1.2,
      })
    }
  }

  const handleZoomOut = () => {
    if (networkInstanceRef.current) {
      const scale = networkInstanceRef.current.getScale()
      networkInstanceRef.current.moveTo({
        scale: scale * 0.8,
      })
    }
  }

  const handleFit = () => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.fit({
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad",
        },
      })
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="space-y-6">
      {/* 筛选面板 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>按分类和标签筛选显示的笔记</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[40px]">
                {tags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">暂无标签</span>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图谱可视化 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>知识网络</CardTitle>
              <CardDescription>
                {graphData
                  ? `共 ${graphData.nodes.length} 个节点，${graphData.edges.length} 条连接`
                  : "加载中..."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={!networkInstanceRef.current}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={!networkInstanceRef.current}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFit}
                disabled={!networkInstanceRef.current}
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadGraphData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : graphData && graphData.nodes.length === 0 ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">没有找到笔记</p>
                <p className="text-sm text-muted-foreground">
                  尝试调整筛选条件或创建一些笔记
                </p>
              </div>
            </div>
          ) : (
            <div
              ref={networkRef}
              className="w-full h-[600px] border rounded-lg bg-background"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

