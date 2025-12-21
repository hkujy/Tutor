import { Redis } from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  return 'redis://localhost:6379'
}

// Lazy Redis instance - only creates connection when first accessed
let redisInstance: Redis | null = null

const getRedisInstance = (): Redis | null => {
  // Skip Redis during build/static generation
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // Check if we're in a build context (no actual runtime environment)
    if (!process.env.REDIS_URL && !process.env.VERCEL) {
      console.warn('Redis not available during build, skipping connection')
      return null
    }
  }

  if (!redisInstance) {
    try {
      redisInstance = new Redis(getRedisUrl(), {
        // Lazy connect - don't connect until first command
        lazyConnect: true,
        // Retry strategy
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        // Don't throw on connection errors
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3,
      })

      // Handle errors gracefully
      redisInstance.on('error', (err) => {
        console.error('Redis connection error:', err.message)
      })

      redisInstance.on('connect', () => {
        console.log('Redis connected successfully')
      })
    } catch (error) {
      console.error('Failed to create Redis instance:', error)
      return null
    }
  }

  return redisInstance
}

// Export for backward compatibility
export const redis = getRedisInstance()

export const checkIdempotency = async (key: string, ttl = 3600): Promise<boolean> => {
  // If Redis is not available (e.g., during build), fail open to allow requests
  if (!redis) {
    console.warn('Redis not available, skipping idempotency check')
    return true
  }

  try {
    const fullKey = `idempotency:${key}`
    // SETNX key "processed"
    // Returns 1 if key was set (was not present)
    // Returns 0 if key was not set (already present)
    const result = await redis.setnx(fullKey, 'processing')

    if (result === 1) {
      // Key didn't exist, we set it. Now set expiry.
      await redis.expire(fullKey, ttl)
      return true // New request
    }

    return false // Duplicate request
  } catch (error) {
    console.error('Redis idempotency check error:', error)
    // If Redis fails, we should fail open or closed depending on requirements.
    // Failing open (returning true) risks duplicates but keeps availability.
    // Failing closed (returning false) blocks requests.
    // Given this is for booking to prevent double-booking, failing closed might be safer, 
    // but availability is usually preferred.
    // However, if we fail open, we might double book.
    // Let's fail open for now but log error.
    return true
  }
}

export const clearIdempotencyKey = async (key: string) => {
  // If Redis is not available (e.g., during build), skip clearing
  if (!redis) {
    console.warn('Redis not available, skipping idempotency key clear')
    return
  }

  try {
    await redis.del(`idempotency:${key}`)
  } catch (error) {
    console.error('Redis clear idempotency error:', error)
  }
}
