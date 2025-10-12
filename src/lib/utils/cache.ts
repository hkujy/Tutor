// Simple in-memory cache for database queries
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private defaultTTL = 30000 // 30 seconds

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  // Generate cache key from query parameters
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  // Invalidate cache entries by pattern
  invalidatePattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

export const queryCache = new QueryCache()

// Cache wrapper for database queries
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = queryCache.get(key)
  if (cached !== null) {
    return cached
  }

  // Execute query and cache result
  const result = await queryFn()
  queryCache.set(key, result, ttl)
  return result
}

// Cache invalidation helpers
export function invalidateUserCache(userId: string) {
  queryCache.invalidatePattern(`user:${userId}`)
  queryCache.invalidatePattern(`appointments:${userId}`)
  queryCache.invalidatePattern(`dashboard:${userId}`)
}

export function invalidateAppointmentCache() {
  queryCache.invalidatePattern('appointments')
  queryCache.invalidatePattern('dashboard')
}

export function invalidateAvailabilityCache(tutorId: string) {
  queryCache.invalidatePattern(`availability:${tutorId}`)
  queryCache.invalidatePattern(`dashboard:${tutorId}`)
}