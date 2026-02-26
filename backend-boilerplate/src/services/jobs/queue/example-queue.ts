import { Queue } from 'bullmq';
import { connectionRedisConfigQueue } from '../connection-redis-config';
import { redisInstance } from '@/lib/redis';

let queueInstance: Queue | null = null;

export function getExampleQueue(): Queue | null {
  if (!queueInstance) {
    if (redisInstance.isDegraded()) {
      console.warn('⚠️ Cannot create queue - Redis is in degraded mode');
      return null;
    }
    try {
      queueInstance = new Queue('example-queue', {
        connection: connectionRedisConfigQueue,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            count: 100,
          },
          removeOnFail: {
            count: 50,
          },
        },
      });
    } catch (err) {
      console.warn('⚠️ Failed to create queue:', (err as Error).message);
      return null;
    }
  }
  return queueInstance;
}

const exampleQueue = {
  get instance() {
    return getExampleQueue();
  },
};

export { exampleQueue };

export async function addToExampleQueue(data: {
  type: string;
  payload: any;
}) {
  const queue = getExampleQueue();
  if (!queue) {
    console.warn('⚠️ Queue unavailable - job not added');
    return null;
  }
  return queue.add(data.type, data.payload, {
    jobId: `${data.type}-${Date.now()}`,
  });
}
