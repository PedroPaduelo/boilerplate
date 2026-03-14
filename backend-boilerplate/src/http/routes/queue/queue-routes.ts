import { z } from 'zod';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  addJob,
  addBulkJobs,
  getQueue,
  QUEUE_NAMES,
  QueueName,
} from '../../../services/jobs/queue/queue-manager';
import { redisInstance } from '@/lib/redis';
import { auth } from '@/middlewares/auth';

// =============================================================================
// SCHEMAS
// =============================================================================

const addJobSchema = z.object({
  queue: z.enum([
    QUEUE_NAMES.EMAIL,
    QUEUE_NAMES.NOTIFICATION,
    QUEUE_NAMES.PROCESSING,
    QUEUE_NAMES.WEBHOOK,
    QUEUE_NAMES.BACKGROUND,
  ]),
  name: z.string().min(1),
  data: z.record(z.any()),
  options: z
    .object({
      priority: z.number().min(1).max(10).optional(),
      delay: z.number().min(0).optional(),
      attempts: z.number().min(1).max(10).optional(),
      jobId: z.string().optional(),
    })
    .optional(),
});

const addBulkJobsSchema = z.object({
  queue: z.enum([
    QUEUE_NAMES.EMAIL,
    QUEUE_NAMES.NOTIFICATION,
    QUEUE_NAMES.PROCESSING,
    QUEUE_NAMES.WEBHOOK,
    QUEUE_NAMES.BACKGROUND,
  ]),
  jobs: z.array(
    z.object({
      name: z.string().min(1),
      data: z.record(z.any()),
      options: z
        .object({
          priority: z.number().min(1).max(10).optional(),
          delay: z.number().min(0).optional(),
          jobId: z.string().optional(),
        })
        .optional(),
    })
  ),
});

const queueParamSchema = z.object({
  queue: z.enum([
    'email-queue',
    'notification-queue',
    'processing-queue',
    'webhook-queue',
    'background-queue',
    'dead-letter-queue',
  ]),
});

const jobIdParamSchema = z.object({
  queue: z.string(),
  jobId: z.string(),
});

// =============================================================================
// ROUTES
// =============================================================================

export async function queueRoutes(app: FastifyInstance) {
  const fastify = app.withTypeProvider<ZodTypeProvider>().register(auth);

  // =============================================================================
  // GET QUEUE STATUS
  // =============================================================================

  fastify.get(
    '/queues',
    {},
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const queueNames = [
        QUEUE_NAMES.EMAIL,
        QUEUE_NAMES.NOTIFICATION,
        QUEUE_NAMES.PROCESSING,
        QUEUE_NAMES.WEBHOOK,
        QUEUE_NAMES.BACKGROUND,
        QUEUE_NAMES.DEAD_LETTER,
      ];

      const queues = await Promise.all(
        queueNames.map(async (name) => {
          const queue = getQueue(name);
          if (!queue) {
            return { name, status: 'unavailable' };
          }

          try {
            const [waiting, active, completed, failed, delayed] = await Promise.all([
              queue.getWaitingCount(),
              queue.getActiveCount(),
              queue.getCompletedCount(),
              queue.getFailedCount(),
              queue.getDelayedCount(),
            ]);

            return {
              name,
              status: 'active',
              counts: {
                waiting,
                active,
                completed,
                failed,
                delayed,
              },
            };
          } catch (error) {
            return { name, status: 'error', error: (error as Error).message };
          }
        })
      );

      return reply.send({ queues });
    }
  );

  // =============================================================================
  // ADD SINGLE JOB
  // =============================================================================

  fastify.post(
    '/queues/add',
    {
      schema: {
        body: addJobSchema,
      },
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof addJobSchema> }>, reply: FastifyReply) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue, name, data, options } = request.body;

      const job = await addJob(queue as QueueName, {
        name,
        data,
        options,
      });

      if (!job) {
        return reply.status(500).send({
          error: 'Failed to add job',
          message: 'Queue unavailable or error occurred',
        });
      }

      return reply.status(201).send({
        success: true,
        job: {
          id: job.id,
          queue: queue,
          name,
          data,
          options,
        },
      });
    }
  );

  // =============================================================================
  // ADD BULK JOBS
  // =============================================================================

  fastify.post(
    '/queues/add-bulk',
    {
      schema: {
        body: addBulkJobsSchema,
      },
    },
    async (
      request: FastifyRequest<{ Body: z.infer<typeof addBulkJobsSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue, jobs } = request.body;

      const addedJobs = await addBulkJobs(queue as QueueName, jobs);

      return reply.status(201).send({
        success: true,
        count: addedJobs.length,
        jobs: addedJobs.map((job: any) => ({
          id: job.id,
          name: job.name,
          data: job.data,
        })),
      });
    }
  );

  // =============================================================================
  // GET JOBS IN QUEUE
  // =============================================================================

  fastify.get(
    '/queues/:queue/jobs',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: queueParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof queueParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      const [waiting, active, failed] = await Promise.all([
        queueInstance.getWaiting({ start: 0, end: 99 }),
        queueInstance.getActive({ start: 0, end: 99 }),
        queueInstance.getFailed({ start: 0, end: 99 }),
      ]);

      return reply.send({
        queue,
        waiting: waiting.map((j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          timestamp: j.timestamp,
        })),
        active: active.map((j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          timestamp: j.timestamp,
          processedOn: j.processedOn,
        })),
        failed: failed.map((j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          failedReason: j.failedReason,
          finishedOn: j.finishedOn,
        })),
      });
    }
  );

  // =============================================================================
  // GET SPECIFIC JOB
  // =============================================================================

  fastify.get(
    '/queues/:queue/jobs/:jobId',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: jobIdParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof jobIdParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue, jobId } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      const job = await queueInstance.getJob(jobId);

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          jobId,
        });
      }

      const state = await job.getState();

      return reply.send({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        failedReason: job.failedReason,
        state,
        timestamp: job.timestamp,
      });
    }
  );

  // =============================================================================
  // RETRY JOB
  // =============================================================================

  fastify.post(
    '/queues/:queue/jobs/:jobId/retry',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: jobIdParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof jobIdParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue, jobId } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      const job = await queueInstance.getJob(jobId);

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          jobId,
        });
      }

      await job.retry();

      return reply.send({
        success: true,
        message: `Job ${jobId} queued for retry`,
      });
    }
  );

  // =============================================================================
  // REMOVE JOB
  // =============================================================================

  fastify.delete(
    '/queues/:queue/jobs/:jobId',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: jobIdParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof jobIdParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue, jobId } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      const job = await queueInstance.getJob(jobId);

      if (!job) {
        return reply.status(404).send({
          error: 'Job not found',
          jobId,
        });
      }

      await job.remove();

      return reply.send({
        success: true,
        message: `Job ${jobId} removed`,
      });
    }
  );

  // =============================================================================
  // CLEAN QUEUE
  // =============================================================================

  fastify.delete(
    '/queues/:queue/clean',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: queueParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof queueParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      const grace = 0;
      const [waitingCleaned, activeCleaned, completedCleaned, failedCleaned] = await Promise.all([
        queueInstance.clean(grace, 100, 'wait'),
        queueInstance.clean(grace, 100, 'active'),
        queueInstance.clean(grace, 100, 'completed'),
        queueInstance.clean(grace, 100, 'failed'),
      ]);

      return reply.send({
        success: true,
        message: `Queue ${queue} cleaned`,
        cleaned: {
          waiting: waitingCleaned,
          active: activeCleaned,
          completed: completedCleaned,
          failed: failedCleaned,
        },
      });
    }
  );

  // =============================================================================
  // EMPTY QUEUE (remove all jobs)
  // =============================================================================

  fastify.delete(
    '/queues/:queue/empty',
    {
      // authentication done via app.register(auth) above
      schema: {
        params: queueParamSchema,
      },
    },
    async (
      request: FastifyRequest<{ Params: z.infer<typeof queueParamSchema> }>,
      reply: FastifyReply
    ) => {
      if (redisInstance.isDegraded()) {
        return reply.status(503).send({
          error: 'Service unavailable',
          message: 'Redis is in degraded mode',
        });
      }

      const { queue } = request.params;
      const queueInstance = getQueue(queue as QueueName);

      if (!queueInstance) {
        return reply.status(404).send({
          error: 'Queue not found',
          queue,
        });
      }

      await queueInstance.empty();

      return reply.send({
        success: true,
        message: `Queue ${queue} emptied`,
      });
    }
  );
}
