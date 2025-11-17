import { Note, NoteLink, Category, Tag } from '@prisma/client'

export type NoteWithRelations = Note & {
  category: Category | null
  tags: Tag[]
  links: NoteLink[]
  backlinks: NoteLink[]
  _count?: {
    links: number
    backlinks: number
  }
}

// 用于列表页显示的类型（不需要完整的 links 和 backlinks 数据，只需要计数）
export type NoteForList = Note & {
  category: Category | null
  tags: Tag[]
  _count?: {
    links: number
    backlinks: number
  }
}

export type NoteLinkWithNotes = NoteLink & {
  fromNote: Pick<Note, 'id' | 'title'>
  toNote: Pick<Note, 'id' | 'title'>
}

