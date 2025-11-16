import { Post, Category, Tag, Comment, User } from '@prisma/client'

export type PostWithRelations = Post & {
  category: Category | null
  tags: Tag[]
  user: Pick<User, 'id' | 'name' | 'image'>
  comments: Comment[]
  _count?: {
    comments: number
    views: number
    likes: number
  }
}

export type PostListItem = Pick<
  Post,
  'id' | 'title' | 'excerpt' | 'slug' | 'coverImage' | 'publishedAt' | 'views' | 'likes'
> & {
  category: Category | null
  tags: Tag[]
  user: Pick<User, 'name' | 'image'>
}

