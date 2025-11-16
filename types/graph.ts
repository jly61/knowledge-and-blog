/**
 * 知识图谱数据类型
 */

export interface GraphNode {
  id: string
  label: string
  title: string
  group?: string // 分类或标签
  value?: number // 节点大小（基于链接数）
  color?: string
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  value?: number // 边的权重
  arrows?: string // 箭头方向
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

