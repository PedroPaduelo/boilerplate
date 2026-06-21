import { Worker, Job } from 'bullmq';
import { connectionRedisConfigWorker } from '../connection-redis-config';
import { getQueue, QUEUE_NAMES } from '../queue/queue-manager';
import { redisInstance } from '@/lib/redis';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';

// =============================================================================
// WORKER CONFIG
// =============================================================================

export interface WorkerConfig {
  queueName: string;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number; // em ms
  };
  lockDuration?: number;
  lockRenewTime?: number;
  maxStalledCount?: number;
}

// =============================================================================
// RATE LIMITER
// =============================================================================

let rateLimiterRedis: RateLimiterRedis | null = null;
let rateLimiterMemory: RateLimiterMemory | null = null;

async function initRateLimiters() {
  // Memory limiter como fallback
  rateLimiterMemory = new RateLimiterMemory({
    points: 100,
    duration: 1000, // 100 requests por segundo
  });

  // Redis limiter (se disponível)
  try {
    const Redis = require('ioredis');
    const redisClient = new Redis({
      host: process.env.REDIS_URL || process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      family: 4,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    await redisClient.connect();
    await redisClient.ping();
    rateLimiterRedis = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'ratelimit',
      points: 100,
      duration: 1000,
    });
    console.log('✅ Rate limiter (Redis) initialized');
  } catch (error) {
    console.warn('⚠️ Rate limiter (Redis) failed, using memory fallback');
  }
}

async function checkRateLimit(key: string): Promise<boolean> {
  try {
    if (rateLimiterRedis) {
      await rateLimiterRedis.consume(key);
      return true;
    }
    if (rateLimiterMemory) {
      await rateLimiterMemory.consume(key);
      return true;
    }
    return true; // Se nenhum limitador, permite
  } catch (rejected) {
    console.warn(`⚠️ Rate limit exceeded for key: ${key}`);
    return false;
  }
}

// =============================================================================
// JOB PROCESSORS
// =============================================================================

type JobProcessor = (job: Job) => Promise<any>;

const processors: Record<string, JobProcessor> = {
  // Email jobs
  'send-email': async (job: Job) => {
    console.log(`📧 Sending email: ${job.data.to}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { sent: true, to: job.data.to };
  },

  'send-bulk-email': async (job: Job) => {
    console.log(`📧 Sending bulk email to ${job.data.recipients?.length || 0} recipients`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { sent: true, count: job.data.recipients?.length || 0 };
  },

  // Notification jobs
  'push-notification': async (job: Job) => {
    console.log(`🔔 Sending push notification: ${job.data.title}`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { delivered: true };
  },

  'send-sms': async (job: Job) => {
    console.log(`📱 Sending SMS to: ${job.data.phone}`);
    await new Promise(resolve => setTimeout(resolve, 400));
    return { sent: true };
  },

  // Processing jobs
  'process-image': async (job: Job) => {
    console.log(`🖼️ Processing image: ${job.data.imageId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { processed: true, imageId: job.data.imageId };
  },

  'generate-report': async (job: Job) => {
    console.log(`📊 Generating report: ${job.data.reportType}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { generated: true, reportType: job.data.reportType };
  },

  'export-data': async (job: Job) => {
    console.log(`📦 Exporting data: ${job.data.format}`);
    await new Promise(resolve => setTimeout(resolve, 8000));
    return { exported: true, format: job.data.format };
  },

  // Webhook jobs
  'call-webhook': async (job: Job) => {
    console.log(`🌐 Calling webhook: ${job.data.url}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { called: true, url: job.data.url };
  },

  // Background jobs
  'cleanup-data': async (job: Job) => {
    console.log(`🧹 Cleaning up data older than ${job.data.daysOld} days`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    return { cleaned: true };
  },

  'sync-external': async (job: Job) => {
    console.log(`🔄 Syncing external data: ${job.data.source}`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    return { synced: true };
  },

  // Default processor
  'default': async (job: Job) => {
    console.log(`⚙️ Processing job: ${job.name} with data:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { processed: true };
  },
};

async function processJob(job: Job): Promise<any> {
  const processor = processors[job.name] || processors['default'];

  // Rate limiting por queue
  const allowed = await checkRateLimit(`job:${job.queueName}`);
  if (!allowed) {
    throw new Error('Rate limit exceeded, job will be retried');
  }

  return processor(job);
}

// =============================================================================
// WORKER MANAGER
// =============================================================================

interface WorkerInstance {
  worker: Worker;
  config: WorkerConfig;
}

const workers = new Map<string, WorkerInstance>();

function createWorker(config: WorkerConfig): Worker {
  const worker = new Worker(config.queueName, processJob, {
    connection: connectionRedisConfigWorker,
    concurrency: config.concurrency || 5,
    limiter: config.limiter || undefined,
    lockDuration: config.lockDuration || 30000,
    lockRenewTime: config.lockRenewTime || 15000,
    maxStalledCount: config.maxStalledCount || 2,

    // Settings
    useWorkerThreads: false,
  });

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} (${job.queueName}) completed in ${job.finishedOn! - job.timestamp}ms`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} (${job?.queueName}) failed:`, err.message);

    // Move to dead letter queue after max attempts
    if (job?.attemptsMade && job.attemptsMade >= (job.opts.attempts || 3)) {
      moveToDeadLetterQueue(job).catch(console.error);
    }
  });

  worker.on('stalled', (jobId) => {
    console.warn(`⚠️ Job ${jobId} (${config.queueName}) stalled`);
  });

  worker.on('error', (err) => {
    console.error(`❌ Worker error for ${config.queueName}:`, err);
  });

  worker.on('closed', () => {
    console.log(`🛑 Worker for ${config.queueName} closed`);
  });

  return worker;
}

export function startWorker(config: WorkerConfig): Worker | null {
  if (redisInstance.isDegraded()) {
    console.warn(`⚠️ Cannot start worker for ${config.queueName} - Redis is in degraded mode`);
    return null;
  }

  const workerKey = `${config.queueName}`;

  if (workers.has(workerKey)) {
    console.warn(`⚠️ Worker for ${config.queueName} already running`);
    return workers.get(workerKey)!.worker;
  }

  try {
    const worker = createWorker(config);
    workers.set(workerKey, { worker, config });

    console.log(`🚀 Worker started for ${config.queueName} (concurrency: ${config.concurrency || 5})`);
    return worker;
  } catch (error) {
    console.error(`❌ Failed to start worker for ${config.queueName}:`, error);
    return null;
  }
}

export function stopWorker(queueName: string): void {
  const workerKey = queueName;
  const instance = workers.get(workerKey);

  if (instance) {
    instance.worker.close();
    workers.delete(workerKey);
    console.log(`🛑 Worker stopped for ${queueName}`);
  }
}

export function stopAllWorkers(): void {
  console.log('🛑 Stopping all workers...');
  for (const [key, instance] of workers) {
    instance.worker.close();
    console.log(`🛑 Worker stopped for ${key}`);
  }
  workers.clear();
  console.log('✅ All workers stopped');
}

/**
 * Gracefully closes all workers, awaiting each `worker.close()` so in-flight
 * jobs can finish/release locks before the process exits. Use this in the
 * shutdown flow (SIGTERM/SIGINT).
 */
export async function closeAllWorkers(): Promise<void> {
  console.log('🛑 Closing all workers...');
  await Promise.all(
    Array.from(workers.entries()).map(async ([key, instance]) => {
      try {
        await instance.worker.close();
        console.log(`🛑 Worker closed for ${key}`);
      } catch (error) {
        console.error(`❌ Failed to close worker for ${key}:`, error);
      }
    })
  );
  workers.clear();
  console.log('✅ All workers closed');
}

export function getWorkerStatus(queueName: string) {
  const instance = workers.get(queueName);
  if (!instance) {
    return { running: false };
  }

  return {
    running: true,
    isRunning: instance.worker.isRunning(),
    isPaused: instance.worker.isPaused(),
  };
}

export function pauseWorker(queueName: string): void {
  const instance = workers.get(queueName);
  if (instance) {
    instance.worker.pause();
    console.log(`⏸️ Worker paused for ${queueName}`);
  }
}

export function resumeWorker(queueName: string): void {
  const instance = workers.get(queueName);
  if (instance) {
    instance.worker.resume();
    console.log(`▶️ Worker resumed for ${queueName}`);
  }
}

// =============================================================================
// DEAD LETTER QUEUE
// =============================================================================

async function moveToDeadLetterQueue(job: Job): Promise<void> {
  try {
    const dlq = getQueue(QUEUE_NAMES.DEAD_LETTER);
    if (!dlq) {
      console.error('❌ Dead letter queue unavailable');
      return;
    }

    await dlq.add('failed-job', {
      originalQueue: job.queueName,
      originalJobId: job.id,
      jobName: job.name,
      jobData: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      timestamp: job.timestamp,
    });

    console.log(`📮 Job ${job.id} moved to dead letter queue`);
  } catch (error) {
    console.error('❌ Failed to move job to DLQ:', error);
  }
}

// =============================================================================
// DEFAULT WORKERS CONFIG
// =============================================================================

export const defaultWorkerConfigs: WorkerConfig[] = [
  {
    queueName: QUEUE_NAMES.EMAIL,
    concurrency: 10,
    limiter: { max: 50, duration: 1000 }, // 50 emails por segundo
  },
  {
    queueName: QUEUE_NAMES.NOTIFICATION,
    concurrency: 15,
    limiter: { max: 100, duration: 1000 }, // 100 notificações por segundo
  },
  {
    queueName: QUEUE_NAMES.PROCESSING,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 }, // 10 processamentos por segundo
  },
  {
    queueName: QUEUE_NAMES.WEBHOOK,
    concurrency: 20,
    limiter: { max: 50, duration: 1000 },
  },
  {
    queueName: QUEUE_NAMES.BACKGROUND,
    concurrency: 3,
    limiter: { max: 5, duration: 1000 },
  },
];

// =============================================================================
// START ALL WORKERS
// =============================================================================

export async function startAllWorkers(): Promise<void> {
  console.log('🚀 Starting all workers...');

  await initRateLimiters();

  for (const config of defaultWorkerConfigs) {
    startWorker(config);
  }

  console.log('✅ All workers started');
}
