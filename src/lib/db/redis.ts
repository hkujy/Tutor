import { createClient } from 'redis'
import { env } from '../config/env'

const globalForRedis = global as unknown as { redis: ReturnType<typeof createClient> }

export const redis =
    globalForRedis.redis ??
    createClient({
        url: env.REDIS_URL || 'redis://localhost:6379',
    })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

redis.on('error', (err) => console.log('Redis Client Error', err))

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect()
    }
}
