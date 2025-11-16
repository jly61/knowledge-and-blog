import { Note, NoteLink } from '@prisma/client'
import { GraphData, GraphNode, GraphEdge } from '@/types/graph'

type NoteWithLinks = Note & {
  links: (NoteLink & { toNote: Pick<Note, 'id' | 'title'> })[]
  backlinks: (NoteLink & { fromNote: Pick<Note, 'id' | 'title'> })[]
}

/**
 * 从笔记和链接关系生成图谱数据
 */
export function generateGraphData(notes: NoteWithLinks[]): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeMap = new Map<string, GraphNode>()

  // 创建节点
  notes.forEach((note) => {
    const linkCount = note.links.length + note.backlinks.length
    const node: GraphNode = {
      id: note.id,
      label: note.title,
      title: note.title,
      value: linkCount > 0 ? linkCount : 1,
    }
    nodes.push(node)
    nodeMap.set(note.id, node)
  })

  // 创建边
  const edgeSet = new Set<string>()
  notes.forEach((note) => {
    // 出链（从当前笔记指向其他笔记）
    note.links.forEach((link) => {
      const edgeId = `${note.id}-${link.toNoteId}`
      if (!edgeSet.has(edgeId)) {
        edges.push({
          id: edgeId,
          from: note.id,
          to: link.toNoteId,
          arrows: 'to',
        })
        edgeSet.add(edgeId)
      }
    })

    // 入链（从其他笔记指向当前笔记）
    note.backlinks.forEach((link) => {
      const edgeId = `${link.fromNoteId}-${note.id}`
      if (!edgeSet.has(edgeId)) {
        edges.push({
          id: edgeId,
          from: link.fromNoteId,
          to: note.id,
          arrows: 'to',
        })
        edgeSet.add(edgeId)
      }
    })
  })

  return { nodes, edges }
}

/**
 * 根据标签或分类给节点分组
 */
export function groupNodesByCategory(
  graphData: GraphData,
  noteCategoryMap: Map<string, string>
): GraphData {
  return {
    ...graphData,
    nodes: graphData.nodes.map((node) => ({
      ...node,
      group: noteCategoryMap.get(node.id) || 'default',
    })),
  }
}

