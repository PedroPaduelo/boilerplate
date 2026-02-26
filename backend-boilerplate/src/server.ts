import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRedis from '@fastify/redis';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { fastify } from 'fastify';
import { Redis } from 'ioredis';
import path from 'path';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';

import { errorHandler } from '@/http/error-handler';
import { env } from '@/lib/env';
import { redisInstance } from '@/lib/redis';
import { setupSocketIO } from './socket';

// Routes
import { healthCheck } from './http/routes/health/health-check';
import { authenticate } from './http/routes/auth/authenticate';
import { getMe } from './http/routes/auth/get-me';
import { createUser } from './http/routes/user/create-user';
import { listUsers } from './http/routes/user/list-users';
import { getUser } from './http/routes/user/get-user';
import { updateUser } from './http/routes/user/update-user';
import { deleteUser } from './http/routes/user/delete-user';

// =============================================================================
// REDIS PRE-CHECK
// =============================================================================

async function isRedisAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new Redis({
      host: env.REDIS_URL,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      family: 4,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    client.on('error', () => {});

    const cleanup = () => {
      try { client.disconnect(false); } catch {}
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 4000);

    client.connect()
      .then(() => client.ping())
      .then(() => {
        clearTimeout(timeout);
        client.quit().catch(() => {});
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        cleanup();
        resolve(false);
      });
  });
}

// =============================================================================
// START
// =============================================================================

async function start() {
  const redisAvailable = await isRedisAvailable();

  const app = fastify().withTypeProvider<ZodTypeProvider>();

  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  app.setErrorHandler(errorHandler);

  // CORS
  app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  // Multipart
  app.register(fastifyMultipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
      files: 5,
      fields: 50,
    },
  });

  // Static files
  const uploadDir = env.UPLOAD_DIR
    ? path.resolve(env.UPLOAD_DIR)
    : path.resolve('./uploads');

  console.log(`📂 Serving uploads from: ${uploadDir}`);

  app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Swagger
  app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Backend Boilerplate API',
        description: 'API documentation for Backend Boilerplate',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(fastifySwaggerUI, {
    routePrefix: '/docs',
  });

  // JWT
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // Redis (only if available)
  if (redisAvailable) {
    app.register(fastifyRedis, {
      host: env.REDIS_URL,
      password: env.REDIS_PASSWORD || undefined,
      port: env.REDIS_PORT,
      family: 4,
    });

    app.addHook('onReady', () => {
      redisInstance.setClient(app.redis);
      console.log('✅ Redis client shared globally');
    });

    // Bull Board
    try {
      const { getExampleQueue } = await import('./services/jobs/queue/example-queue');
      const queue = getExampleQueue();

      if (queue) {
        const serverAdapter = new FastifyAdapter();
        createBullBoard({
          queues: [new BullMQAdapter(queue)],
          serverAdapter,
        });
        serverAdapter.setBasePath('/queues');
        app.register(serverAdapter.registerPlugin(), { prefix: '/queues' });
        console.log('📊 Bull Board registered at /queues');
      }
    } catch (err) {
      console.warn('⚠️ BullMQ setup failed:', (err as Error).message);
    }
  } else {
    redisInstance.setDegraded(true);
    console.warn('⚠️ Redis offline - modo degradado (sem cache e filas)');
  }

  // Routes
  app.register(healthCheck);
  app.register(authenticate);
  app.register(getMe);
  app.register(createUser);
  app.register(listUsers);
  app.register(getUser);
  app.register(updateUser);
  app.register(deleteUser);

  // Start
  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Server is running on ${address}                       ║
║                                                            ║
║   📚 Docs:   ${address}/docs                               ║
║   📊 Queues: ${address}/queues                             ║
║   ❤️  Health: ${address}/health                            ║
║   ${redisAvailable ? '✅ Redis: connected' : '⚠️  Redis: degraded mode'}                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  setupSocketIO(app);
}

start().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
