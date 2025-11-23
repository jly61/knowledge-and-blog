/**
 * 环境配置管理
 * 
 * 统一管理不同环境的配置，避免在代码中直接使用 process.env
 */

type Environment = 'development' | 'preview' | 'production'

function getEnv(): Environment {
  // 优先检查 VERCEL_ENV（Vercel 预览环境）
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  
  const env = (process.env.NODE_ENV || 'development') as string
  if (env === 'production') return 'production'
  // 支持自定义 'preview' 值（虽然 NODE_ENV 标准值不包含，但允许自定义）
  if (env === 'preview') return 'preview'
  return 'development'
}

const env = getEnv()

export const config = {
  env,
  isDevelopment: env === 'development',
  isPreview: env === 'preview',
  isProduction: env === 'production',
  
  // 应用配置
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || '知识库 + 博客',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL!,
    // 生产环境使用连接池
    connectionLimit: env === 'production' ? 10 : 5,
  },
  
  // NextAuth 配置
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  // OAuth 配置
  oauth: {
    github: {
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  
  // 功能开关
  features: {
    // 是否启用 OAuth 登录
    oauthEnabled: !!(process.env.GITHUB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
  },
} as const

// 类型安全的配置访问
export type Config = typeof config

// 验证必需配置
if (config.isProduction) {
  const required = [
    { key: 'DATABASE_URL', value: config.database.url },
    { key: 'NEXTAUTH_URL', value: config.auth.url },
    { key: 'NEXTAUTH_SECRET', value: config.auth.secret },
  ]
  
  const missing = required.filter(({ value }) => !value)
  if (missing.length > 0) {
    throw new Error(
      `缺少必需的环境变量: ${missing.map(({ key }) => key).join(', ')}\n` +
      '请检查生产环境配置。'
    )
  }
}

