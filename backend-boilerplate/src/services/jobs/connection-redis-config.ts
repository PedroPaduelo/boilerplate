import { env } from '@/lib/env';

export const connectionRedisConfigQueue = {
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4, // Force IPv4
};

export const connectionRedisConfigWorker = {
  maxRetriesPerRequest: null, // Required by BullMQ
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4, // Force IPv4
  connectTimeout: 10000, // 10 seconds
};
