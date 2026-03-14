import { Queue, QueueEvents } from 'bullmq';
import { connectionRedisConfigQueue } from '../connection-redis-config';
import { redisInstance } from '@/lib/redis';

// =============================================================================
// FILAS DEFINITIONS
// =============================================================================

export const QUEUE_NAMES = {
  // Filas principais com prioridade
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  PROCESSING: 'processing-queue',
  WEBHOOK: 'webhook-queue',

  // Filas de background jobs
  BACKGROUND: 'background-queue',

  // Dead Letter Queue
  DEAD_LETTER: 'dead-letter-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// =============================================================================
// QUEUE OPTIONS
// =============================================================================

interface QueueConfig {
  name: string;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay?: number;
    };
    priority?: number;
    removeOnComplete?: boolean | { count: number };
    removeOnFail?: boolean | { count: number };
    delay?: number;
    lifo?: boolean;
  };
}

const queueConfigs: QueueConfig[] = [
  {
    name: QUEUE_NAMES.EMAIL,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      priority: 1, // Alta prioridade
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    },
  },
  {
    name: QUEUE_NAMES.NOTIFICATION,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      priority: 2,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
    },
  },
  {
    name: QUEUE_NAMES.PROCESSING,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 },
      priority: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  },
  {
    name: QUEUE_NAMES.WEBHOOK,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
      priority: 2,
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 100 },
    },
  },
  {
    name: QUEUE_NAMES.BACKGROUND,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      priority: 5, // Baixa prioridade
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
    },
  },
  {
    name: QUEUE_NAMES.DEAD_LETTER,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    },
  },
];

// =============================================================================
// QUEUE INSTANCES
// =============================================================================

const queueInstances = new Map<QueueName, Queue>();
const queueEventsInstances = new Map<QueueName, QueueEvents>();

function createQueue(name: string, config?: QueueConfig): Queue {
  return new Queue(name, {
    connection: connectionRedisConfigQueue,
    defaultJobOptions: config?.defaultJobOptions,
  });
}

function createQueueEvents(name: string): QueueEvents {
  return new QueueEvents(name, {
    connection: connectionRedisConfigQueue,
  });
}

export function getQueue(name: QueueName): Queue | null {
  if (redisInstance.isDegraded()) {
    console.warn(`⚠️ Cannot get queue ${name} - Redis is in degraded mode`);
    return null;
  }

  if (!queueInstances.has(name)) {
    const config = queueConfigs.find(c => c.name === name);
    const queue = createQueue(name, config);
    queueInstances.set(name, queue);
  }

  return queueInstances.get(name)!;
}

export function getQueueEvents(name: QueueName): QueueEvents | null {
  if (redisInstance.isDegraded()) {
    return null;
  }

  if (!queueEventsInstances.has(name)) {
    const events = createQueueEvents(name);
    queueEventsInstances.set(name, events);
  }

  return queueEventsInstances.get(name)!;
}

export function getAllQueues(): Queue[] {
  return Array.from(queueInstances.values());
}

export function getAllQueueNames(): string[] {
  return queueConfigs.map(c => c.name);
}

// =============================================================================
// ADD JOB HELPERS
// =============================================================================

export interface AddJobOptions {
  name: string;
  data: Record<string, any>;
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    jobId?: string;
    removeOnComplete?: boolean | { count: number };
    removeOnFail?: boolean | { count: number };
    repeatJobKey?: string;
  };
}

export async function addJob(queueName: QueueName, options: AddJobOptions) {
  const queue = getQueue(queueName);
  if (!queue) {
    console.warn(`⚠️ Queue ${queueName} unavailable - job not added`);
    return null;
  }

  try {
    const job = await queue.add(options.name, options.data, options.options);
    console.log(`📝 Job added to ${queueName}: ${job.id} (${options.name})`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to add job to ${queueName}:`, error);
    return null;
  }
}

// =============================================================================
// BULK ADD JOBS
// =============================================================================

export async function addBulkJobs(
  queueName: QueueName,
  jobs: AddJobOptions[]
): Promise<any[]> {
  const queue = getQueue(queueName);
  if (!queue) {
    console.warn(`⚠️ Queue ${queueName} unavailable - jobs not added`);
    return [];
  }

  try {
    const bulkJobs = jobs.map(job => ({
      name: job.name,
      data: job.data,
      opts: job.options,
    }));

    const addedJobs = await queue.addBulk(bulkJobs);
    console.log(`📝 ${addedJobs.length} jobs added to ${queueName}`);
    return addedJobs;
  } catch (error) {
    console.error(`❌ Failed to bulk add jobs to ${queueName}:`, error);
    return [];
  }
}

// =============================================================================
// CLOSE ALL QUEUES
// =============================================================================

export async function closeAllQueues(): Promise<void> {
  console.log('🛑 Closing all queues...');

  for (const queue of queueInstances.values()) {
    await queue.close();
  }
  queueInstances.clear();

  for (const events of queueEventsInstances.values()) {
    await events.close();
  }
  queueEventsInstances.clear();

  console.log('✅ All queues closed');
}
