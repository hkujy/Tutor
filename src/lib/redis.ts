import { Redis } from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  return 'redis://localhost:6379'
}

// Create a singleton Redis instance
export const redis = new Redis(getRedisUrl())

export const checkIdempotency = async (key: string, ttl = 3600): Promise<boolean> => {
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
  try {
    await redis.del(`idempotency:${key}`)
  } catch (error) {
    console.error('Redis clear idempotency error:', error)
  }
}
