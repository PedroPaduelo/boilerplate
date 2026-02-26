import type { FastifyRedis } from '@fastify/redis';
import type { Redis } from 'ioredis';

type RedisClient = Redis | FastifyRedis;

class RedisInstance {
  private client: RedisClient | null = null;
  private _isDegraded = false;

  setClient(client: RedisClient): void {
    this.client = client;
    this._isDegraded = false;
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

  isDegraded(): boolean {
    return this._isDegraded;
  }

  setDegraded(value: boolean): void {
    this._isDegraded = value;
  }
}

export const redisInstance = new RedisInstance();
