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

export const exampleWorker = new Worker(
  'example-queue',
  processExampleJob,
  {
    concurrency: 5, // Process 5 jobs simultaneously
    connection: connectionRedisConfigWorker,
  }
);

// Event handlers
exampleWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

exampleWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});

exampleWorker.on('ready', () => {
  console.log('🚀 Example worker is ready and connected to Redis');
});

exampleWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('📋 Example worker instance created');
