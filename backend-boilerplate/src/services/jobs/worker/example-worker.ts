import { Worker, Job } from 'bullmq';
import { connectionRedisConfigWorker } from '../connection-redis-config';

// Job processor function
async function processExampleJob(job: Job) {
  console.log(`Processing job ${job.id} of type ${job.name}`);
  console.log('Job data:', job.data);

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Your job processing logic here
  // Example:
  // switch (job.name) {
  //   case 'send-email':
  //     await sendEmail(job.data);
  //     break;
  //   case 'process-data':
  //     await processData(job.data);
  //     break;
  // }

  console.log(`Job ${job.id} completed`);
  return { success: true };
}

let worker: Worker | null = null;

export async function startWorker(): Promise<Worker | null> {
  if (worker) return worker;

  try {
    worker = new Worker('example-queue', processExampleJob, {
      concurrency: 5,
      connection: connectionRedisConfigWorker,
    });

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
    });

    worker.on('ready', () => {
      console.log('🚀 Example worker is ready and connected to Redis');
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
    });

    console.log('📋 Example worker started');
    return worker;
  } catch (err) {
    console.warn('⚠️ Failed to start worker:', (err as Error).message);
    return null;
  }
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('🛑 Example worker stopped');
  }
}

export const exampleWorker = {
  get id() {
    return worker?.id ?? 'not-started';
  },
};
