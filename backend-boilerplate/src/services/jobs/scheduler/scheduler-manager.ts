import { Queue, RepeatOptions } from 'bullmq';
import { connectionRedisConfigQueue } from './connection-redis-config';
import { redisInstance } from '@/lib/redis';
import { QUEUE_NAMES } from './queue-manager';

// =============================================================================
// SCHEDULED JOBS
// =============================================================================

export interface ScheduledJob {
  name: string;
  queueName: string;
  data: Record<string, any>;
  options?: RepeatOptions;
}

// =============================================================================
// REPEAT PATTERNS
// =============================================================================

export const RepeatPatterns = {
  // A cada minuto
  everyMinute: (options?: Partial<RepeatOptions>): RepeatOptions => ({
    every: 60000,
    immediately: true,
    ...options,
  }),

  // A cada 5 minutos
  every5Minutes: (options?: Partial<RepeatOptions>): RepeatOptions => ({
    every: 300000,
    immediately: true,
    ...options,
  }),

  // A cada 15 minutos
  every15Minutes: (options?: Partial<RepeatOptions>): RepeatOptions => ({
    every: 900000,
    immediately: true,
    ...options,
  }),

  // A cada hora
  everyHour: (options?: Partial<RepeatOptions>): RepeatOptions => ({
    every: 3600000,
    immediately: true,
    ...options,
  }),

  // Diariamente às X horas
  dailyAt: (hour: number, minute: number = 0, options?: Partial<RepeatOptions>): RepeatOptions => {
    const cron = `${minute} ${hour} * * *`;
    return {
      cron,
      tz: 'America/Sao_Paulo',
      ...options,
    };
  },

  // Semanalmente (domingo)
  weeklyOnSunday: (hour: number = 0, minute: number = 0, options?: Partial<RepeatOptions>): RepeatOptions => {
    const cron = `${minute} ${hour} * * 0`;
    return {
      cron,
      tz: 'America/Sao_Paulo',
      ...options,
    };
  },

  // Mensalmente
  monthly: (day: number = 1, hour: number = 0, minute: number = 0, options?: Partial<RepeatOptions>): RepeatOptions => {
    const cron = `${minute} ${hour} ${day} * *`;
    return {
      cron,
      tz: 'America/Sao_Paulo',
      ...options,
    };
  },

  // Dias úteis (segunda a sexta)
  weekdays: (hour: number = 9, minute: number = 0, options?: Partial<RepeatOptions>): RepeatOptions => {
    const cron = `${minute} ${hour} * * 1-5`;
    return {
      cron,
      tz: 'America/Sao_Paulo',
      ...options,
    };
  },
};

// =============================================================================
// SCHEDULER MANAGER
// =============================================================================

const scheduledJobs = new Map<string, { job: any; queue: Queue }>();

function getSchedulerQueue(): Queue | null {
  if (redisInstance.isDegraded()) {
    console.warn('⚠️ Cannot get scheduler queue - Redis is in degraded mode');
    return null;
  }

  return new Queue('scheduler-queue', {
    connection: connectionRedisConfigQueue,
  });
}

// =============================================================================
// ADD REPEATABLE JOB
// =============================================================================

export async function addRepeatableJob(
  jobKey: string,
  name: string,
  queueName: string,
  data: Record<string, any>,
  repeatOptions: RepeatOptions
): Promise<any | null> {
  const queue = getSchedulerQueue();
  if (!queue) {
    console.warn('⚠️ Scheduler unavailable - repeatable job not added');
    return null;
  }

  // Remove job anterior com mesma key se existir
  if (scheduledJobs.has(jobKey)) {
    const existingJob = scheduledJobs.get(jobKey);
    if (existingJob) {
      await existingJob.job.remove();
    }
    scheduledJobs.delete(jobKey);
  }

  try {
    const job = await queue.add(name, data, {
      repeatJobKey: jobKey,
      ...repeatOptions,
    });

    scheduledJobs.set(jobKey, { job, queue });
    console.log(`🔄 Repeatable job added: ${jobKey} (${name})`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to add repeatable job ${jobKey}:`, error);
    return null;
  }
}

// =============================================================================
// REMOVE REPEATABLE JOB
// =============================================================================

export async function removeRepeatableJob(jobKey: string): Promise<boolean> {
  const scheduled = scheduledJobs.get(jobKey);
  if (!scheduled) {
    console.warn(`⚠️ No scheduled job found with key: ${jobKey}`);
    return false;
  }

  try {
    await scheduled.job.remove();
    scheduledJobs.delete(jobKey);
    console.log(`🗑️ Repeatable job removed: ${jobKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove repeatable job ${jobKey}:`, error);
    return false;
  }
}

// =============================================================================
// GET ALL REPEATABLE JOBS
// =============================================================================

export async function getRepeatableJobs(): Promise<any[]> {
  const queue = getSchedulerQueue();
  if (!queue) return [];

  try {
    const jobs = await queue.getRepeatableJobs();
    return jobs;
  } catch (error) {
    console.error('❌ Failed to get repeatable jobs:', error);
    return [];
  }
}

// =============================================================================
// SCHEDULE ONE-TIME JOB (DELAYED)
// =============================================================================

export async function scheduleJob(
  name: string,
  queueName: string,
  data: Record<string, any>,
  delayMs: number
): Promise<any | null> {
  const { getQueue } = await import('./queue-manager');
  const queue = getQueue(queueName as any);

  if (!queue) {
    console.warn(`⚠️ Queue ${queueName} unavailable - scheduled job not added`);
    return null;
  }

  try {
    const job = await queue.add(name, data, {
      delay: delayMs,
    });

    console.log(`⏰ Job scheduled: ${job.id} for ${new Date(Date.now() + delayMs).toISOString()}`);
    return job;
  } catch (error) {
    console.error(`❌ Failed to schedule job:`, error);
    return null;
  }
}

// =============================================================================
// SCHEDULE JOB AT SPECIFIC TIME
// =============================================================================

export async function scheduleJobAt(
  name: string,
  queueName: string,
  data: Record<string, any>,
  scheduledTime: Date
): Promise<any | null> {
  const delayMs = scheduledTime.getTime() - Date.now();
  if (delayMs <= 0) {
    console.warn('⚠️ Scheduled time is in the past');
    return null;
  }

  return scheduleJob(name, queueName, data, delayMs);
}

// =============================================================================
// EXAMPLE: COMMON SCHEDULED JOBS
// =============================================================================

export async function setupCommonScheduledJobs() {
  console.log('📅 Setting up common scheduled jobs...');

  // Limpeza diária de dados antigos (todos os dias à 3:00)
  await addRepeatableJob(
    'daily-cleanup',
    'cleanup-data',
    QUEUE_NAMES.BACKGROUND,
    { daysOld: 30 },
    RepeatPatterns.dailyAt(3, 0)
  );

  // Sincronização externa a cada hora
  await addRepeatableJob(
    'hourly-sync',
    'sync-external',
    QUEUE_NAMES.BACKGROUND,
    { source: 'external-api' },
    RepeatPatterns.everyHour()
  );

  // Relatório diário às 8:00
  await addRepeatableJob(
    'daily-report',
    'generate-report',
    QUEUE_NAMES.PROCESSING,
    { reportType: 'daily-summary', format: 'pdf' },
    RepeatPatterns.weekdays(8, 0)
  );

  // Backup mensal (dia 1 às 2:00)
  await addRepeatableJob(
    'monthly-backup',
    'export-data',
    QUEUE_NAMES.PROCESSING,
    { format: 'json', type: 'full-backup' },
    RepeatPatterns.monthly(1, 2, 0)
  );

  console.log('✅ Common scheduled jobs configured');
}

// =============================================================================
// REMOVE ALL SCHEDULED JOBS
// =============================================================================

export async function removeAllScheduledJobs(): Promise<void> {
  console.log('🗑️ Removing all scheduled jobs...');

  for (const [key, scheduled] of scheduledJobs) {
    try {
      await scheduled.job.remove();
    } catch (error) {
      console.error(`❌ Failed to remove scheduled job ${key}:`, error);
    }
  }

  scheduledJobs.clear();
  console.log('✅ All scheduled jobs removed');
}
