import { PrismaClient } from '@prisma/client'
import { logger } from './monitoring/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : [
          {
            emit: 'event',
            level: 'error',
          },
        ],
  })

// 生产环境：监听 Prisma 错误并发送到监控系统
if (process.env.NODE_ENV === 'production') {
  db.$on('error' as never, (e: { message: string; target?: string }) => {
    logger.error('Prisma database error', new Error(e.message), {
      target: e.target,
    })
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

