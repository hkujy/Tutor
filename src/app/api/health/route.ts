import { NextRequest, NextResponse } from 'next/server'

type HealthStatus = {
  status: 'healthy' | 'unhealthy'
  latency?: number
  message?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const start = Date.now()

  try {
    // Basic health check - skip database connections during build
    let dbHealth: HealthStatus = {
      status: 'healthy',
      message: 'Build mode - skipped DB check',
    }
    let redisHealth: HealthStatus = {
      status: 'healthy',
      message: 'Build mode - skipped Redis check',
    }

    // Only check actual connections at runtime (not during build)
    if (
      process.env.NODE_ENV !== 'test' &&
      typeof process !== 'undefined' &&
      process.env.NEXT_PHASE !== 'phase-production-build'
    ) {
      try {
        // Dynamic import to avoid build-time execution
        const { checkDatabaseHealth } = await import('../../../lib/db/client')
        dbHealth = await checkDatabaseHealth()
      } catch (error) {
        dbHealth = {
          status: 'unhealthy',
          error:
            error instanceof Error
              ? error.message
              : 'Database connection failed',
        }
      }

      try {
        const { redis } = await import('../../../lib/config/cache')
        const redisStart = Date.now()
        await redis.connect()
        const client = redis.getClient()
        await client.ping()
        const redisLatency = Date.now() - redisStart
        redisHealth = { status: 'healthy', latency: redisLatency }
      } catch (error) {
        redisHealth = {
          status: 'unhealthy',
          error:
            error instanceof Error ? error.message : 'Redis connection failed',
        }
      }
    }

    const totalTime = Date.now() - start
    const isHealthy =
      dbHealth.status === 'healthy' && redisHealth.status === 'healthy'

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: `${totalTime}ms`,
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    }

    // In development, do not fail the endpoint with 503; surface degraded status with 200
    const statusCode = isHealthy
      ? 200
      : (process.env.NODE_ENV === 'production' ? 503 : 200)

    return NextResponse.json(healthData, {
      status: statusCode,
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
