import { Queue } from 'bullmq';
import { connectionRedisConfigQueue } from '../connection-redis-config';

// Example queue for processing tasks
export const exampleQueue = new Queue('example-queue', {
  connection: connectionRedisConfigQueue,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Helper to add jobs to the queue
export async function addToExampleQueue(data: {
  type: string;
  payload: any;
}) {
  return exampleQueue.add(data.type, data.payload, {
    jobId: `${data.type}-${Date.now()}`,
  });
}
