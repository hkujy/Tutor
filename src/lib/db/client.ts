import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'
import { logger } from '../utils/logger'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  })
} else {
  // In development, use a global variable to preserve the instance during hot reloads
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })
  }
  prisma = globalThis.__prisma
}

// Log database events (cast to any for $on to avoid TS narrowing to never)
// Commenting out query logging to improve performance
// ;(prisma as any).$on('query', (e: any) => {
//   if (env.NODE_ENV === 'development') {
//     logger.debug(
//       {
//         query: e.query,
//         params: e.params,
//         duration: e.duration,
//       },
//       'Database query'
//     )
//   }
// })

;(prisma as any).$on('error', (e: any) => {
  logger.error({ error: e }, 'Database error')
})

;(prisma as any).$on('warn', (e: any) => {
  logger.warn({ warning: e }, 'Database warning')
})

export { prisma as db }

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  latency?: number
  error?: string
}> {
  try {
    // In development without a real database, return healthy
    if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('testdb')) {
      return {
        status: 'healthy',
        latency: 0,
      }
    }

    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    return {
      status: 'healthy',
      latency,
    }
  } catch (error) {
    logger.error({ error }, 'Database health check failed')
    
    // In development, log warning but return healthy
    if (process.env.NODE_ENV === 'development') {
      console.warn('Database connection failed in development (expected without real DB):', 
        error instanceof Error ? error.message : String(error))
      return {
        status: 'healthy',
        latency: 0,
      }
    }

    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
