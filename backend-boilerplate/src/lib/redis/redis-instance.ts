import type { FastifyRedis } from '@fastify/redis';
import type { Redis } from 'ioredis';

type RedisClient = Redis | FastifyRedis;

class RedisInstance {
  private client: RedisClient | null = null;

  setClient(client: RedisClient): void {
    this.client = client;
    console.log('✅ Redis client set globally');
  }

  getClient(): RedisClient {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  isInitialized(): boolean {
    return this.client !== null;
  }
}

export const redisInstance = new RedisInstance();
