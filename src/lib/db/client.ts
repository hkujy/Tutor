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
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  })
} else {
  // In development, use a global variable to preserve the instance during hot reloads
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    })
  }
  prisma = globalThis.__prisma
}

// Log database events
prisma.$on('query', (e) => {
  if (env.NODE_ENV === 'development') {
    logger.debug({ 
      query: e.query, 
      params: e.params, 
      duration: e.duration 
    }, 'Database query')
  }
})

prisma.$on('error', (e) => {
  logger.error({ error: e }, 'Database error')
})

prisma.$on('warn', (e) => {
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
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency,
    }
  } catch (error) {
    logger.error({ error }, 'Database health check failed')
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
