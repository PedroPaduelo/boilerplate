import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRedis from '@fastify/redis';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyBasicAuth from '@fastify/basic-auth';
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
import { prisma } from '@/lib/prisma';
import { startAllWorkers, closeAllWorkers } from './services/jobs/worker/worker-manager';
import { closeAllQueues } from './services/jobs/queue/queue-manager';

// Routes
import { healthCheck } from './http/routes/health/health-check';
import { authenticate } from './http/routes/auth/authenticate';
import { register } from './http/routes/auth/register';
import { getMe } from './http/routes/auth/get-me';
import { createUser } from './http/routes/user/create-user';
import { listUsers } from './http/routes/user/list-users';
import { getUserStats } from './http/routes/user/get-user-stats';
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

  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Redact sensitive headers so secrets never end up in logs.
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'request.headers.authorization',
          'request.headers.cookie',
          'headers.authorization',
          'headers.cookie',
        ],
        censor: '[REDACTED]',
      },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  app.setErrorHandler(errorHandler);

  // Security headers (Helmet)
  app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
  });

  // Rate limiting - global
  app.register(fastifyRateLimit, {
    max: 100, // 100 requests per window
    timeWindow: '1 minute',
    redis: redisAvailable ? app.redis : undefined,
    keyGenerator: (request) => {
      // Use IP or user ID if authenticated
      return request.ip;
    },
  });

  // CORS - Restrictive configuration
  const allowedOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(o => o.trim())
    : env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:5173', 'http://localhost:4000'];

  app.register(fastifyCors, {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

  // Swagger (with optional basic auth protection)
  const swaggerUser = env.SWAGGER_USER;
  const swaggerPass = env.SWAGGER_PASSWORD;

  if (swaggerUser && swaggerPass) {
    app.register(fastifyBasicAuth, {
      validate: (username, password, req, reply, done) => {
        done({ username, valid: username === swaggerUser && password === swaggerPass });
      },
      ignore: (req) => !req.url.startsWith('/docs'), // Only protect /docs routes
    });
  } else {
    console.warn('⚠️  Swagger is not protected - set SWAGGER_USER and SWAGGER_PASSWORD for production');
  }

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

    // Bull Board with all queues
    try {
      const { QUEUE_NAMES } = await import('./services/jobs/queue/queue-manager.js');
      const { getQueue } = await import('./services/jobs/queue/queue-manager.js');

      const queuesToMonitor = [
        QUEUE_NAMES.EMAIL,
        QUEUE_NAMES.NOTIFICATION,
        QUEUE_NAMES.PROCESSING,
        QUEUE_NAMES.WEBHOOK,
        QUEUE_NAMES.BACKGROUND,
        QUEUE_NAMES.DEAD_LETTER,
      ];

      const queueAdapters = queuesToMonitor
        .map(name => {
          const queue = getQueue(name);
          return queue ? new BullMQAdapter(queue) : null;
        })
        .filter(Boolean);

      if (queueAdapters.length > 0) {
        const serverAdapter = new FastifyAdapter();
        createBullBoard({
          queues: queueAdapters as any,
          serverAdapter,
        });
        serverAdapter.setBasePath('/queues');
        app.register(serverAdapter.registerPlugin(), { prefix: '/queues' });
        console.log('📊 Bull Board registered at /queues');
      }

      // Start all workers
      await startAllWorkers();
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
  app.register(register);
  app.register(getMe);
  app.register(createUser);
  app.register(listUsers);
  app.register(getUserStats);
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

  const io = setupSocketIO(app);

  // ===========================================================================
  // GRACEFUL SHUTDOWN
  // ===========================================================================

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n🛑 Received ${signal} - starting graceful shutdown...`);

    // Safety timeout: force-exit if shutdown hangs.
    const forceExit = setTimeout(() => {
      console.error('⏱️  Graceful shutdown timed out - forcing exit');
      process.exit(1);
    }, 15000);
    forceExit.unref();

    try {
      // 1. Stop accepting new connections (HTTP + plugins, incl. Redis client).
      await io.close();
      console.log('✅ Socket.IO closed');

      await app.close();
      console.log('✅ Fastify closed');

      // 2. Drain BullMQ workers and queues.
      await closeAllWorkers();
      await closeAllQueues();

      // 3. Close database connections.
      await prisma.$disconnect();
      console.log('✅ Prisma disconnected');

      clearTimeout(forceExit);
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      clearTimeout(forceExit);
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
