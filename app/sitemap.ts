import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://knowledge-and-blog.vercel.app'

  // 获取所有已发布的文章
g  // 在构建时，如果数据库不可用，返回空数组
  let posts: Array<{
    slug: string
    updatedAt: Date | null
    publishedAt: Date | null
  }> = []
  
  try {
    posts = await db.post.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    })
  } catch (error) {
    // 构建时数据库可能不可用，静默失败
    console.warn('构建时无法连接数据库，sitemap 将只包含静态页面:', error)
  }

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // 文章页面
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...postPages]
}

