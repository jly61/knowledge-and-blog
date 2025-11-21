import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://knowledge-and-blog.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/notes/',
          '/categories/',
          '/tags/',
          '/search/',
          '/graph/',
          '/login',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

