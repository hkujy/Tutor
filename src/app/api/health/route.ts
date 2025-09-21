import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db/client'
import { redis } from '@/lib/config/cache'
import { env } from '@/lib/config/env'

export async function GET(request: NextRequest) {
  const start = Date.now()
  
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth()
    
    // Check Redis health
    let redisHealth: { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }
    try {
      const redisStart = Date.now()
      await redis.connect()
      const client = redis.getClient()
      await client.ping()
      const redisLatency = Date.now() - redisStart
      redisHealth = { status: 'healthy', latency: redisLatency }
    } catch (error) {
      redisHealth = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    const totalTime = Date.now() - start
    const isHealthy = dbHealth.status === 'healthy' && redisHealth.status === 'healthy'

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      responseTime: `${totalTime}ms`,
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    }

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - start}ms`,
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}
