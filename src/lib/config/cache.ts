import { createClient, RedisClientType } from 'redis'
import { env } from './env'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnected = false

  async connect() {
    if (this.isConnected && this.client) {
      return this.client
    }

    try {
      this.client = createClient({
        url: env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      })

      this.client.on('error', (err) => {
        console.error('Redis client error:', err)
      })

      this.client.on('connect', () => {
        console.log('Connected to Redis')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis')
        this.isConnected = false
      })

      await this.client.connect()
      return this.client
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit()
      this.isConnected = false
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected. Call connect() first.')
    }
    return this.client
  }

  isReady() {
    return this.isConnected && this.client?.isReady
  }
}

export const redis = new RedisClient()
export type { RedisClientType }
