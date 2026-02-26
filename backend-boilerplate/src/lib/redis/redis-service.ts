import type { FastifyRedis } from '@fastify/redis';
import type { Redis } from 'ioredis';
import { redisInstance } from './redis-instance';

type RedisClient = Redis | FastifyRedis;

export class RedisService {
  private get redis(): RedisClient {
    return redisInstance.getClient();
  }

  isReady(): boolean {
    return redisInstance.isInitialized();
  }

  // String operations
  async getValue(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async setValue(
    key: string,
    value: string,
    expirationInSeconds?: number
  ): Promise<string> {
    try {
      if (expirationInSeconds) {
        return await this.redis.set(key, value, 'EX', expirationInSeconds);
      }
      return await this.redis.set(key, value);
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async hasKey(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`Error checking key ${key}:`, error);
      throw error;
    }
  }

  async deleteKey(key: string): Promise<number> {
    try {
      return await this.redis.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  // Set operations
  async addToSet(key: string, value: string): Promise<number> {
    try {
      return await this.redis.sadd(key, value);
    } catch (error) {
      console.error(`Error adding to set ${key}:`, error);
      throw error;
    }
  }

  async getSetMembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      console.error(`Error getting set members ${key}:`, error);
      throw error;
    }
  }

  // Counter operations
  async increment(key: string, increment = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, increment);
    } catch (error) {
      console.error(`Error incrementing ${key}:`, error);
      throw error;
    }
  }

  // Hash operations
  async setHashField(
    hashKey: string,
    field: string,
    value: string
  ): Promise<number> {
    try {
      return await this.redis.hset(hashKey, field, value);
    } catch (error) {
      console.error(`Error setting hash field ${hashKey}.${field}:`, error);
      throw error;
    }
  }

  async getHashField(hashKey: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(hashKey, field);
    } catch (error) {
      console.error(`Error getting hash field ${hashKey}.${field}:`, error);
      throw error;
    }
  }

  async getHashAll(hashKey: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(hashKey);
    } catch (error) {
      console.error(`Error getting hash ${hashKey}:`, error);
      throw error;
    }
  }

  // List operations
  async addToList(key: string, value: string): Promise<number> {
    try {
      return await this.redis.rpush(key, value);
    } catch (error) {
      console.error(`Error adding to list ${key}:`, error);
      throw error;
    }
  }

  async getList(key: string): Promise<string[]> {
    try {
      return await this.redis.lrange(key, 0, -1);
    } catch (error) {
      console.error(`Error getting list ${key}:`, error);
      throw error;
    }
  }

  // TTL operations
  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.redis.expire(key, seconds);
    } catch (error) {
      console.error(`Error setting expiration for ${key}:`, error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error(`Error getting keys with pattern ${pattern}:`, error);
      throw error;
    }
  }
}

export const redisService = new RedisService();
