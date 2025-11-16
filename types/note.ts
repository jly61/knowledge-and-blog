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

export type NoteLinkWithNotes = NoteLink & {
  fromNote: Pick<Note, 'id' | 'title'>
  toNote: Pick<Note, 'id' | 'title'>
}

