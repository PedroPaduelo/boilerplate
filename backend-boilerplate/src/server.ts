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
import { startAllWorkers } from './services/jobs/worker/worker-manager';
import { getAllQueues } from './services/jobs/queue/queue-manager';

// Routes
import { healthCheck } from './http/routes/health/health-check';
import { authenticate } from './http/routes/auth/authenticate';
import { getMe } from './http/routes/auth/get-me';
import { createUser } from './http/routes/user/create-user';
import { listUsers } from './http/routes/user/list-users';
import { getUser } from './http/routes/user/get-user';
import { updateUser } from './http/routes/user/update-user';
import { deleteUser } from './http/routes/user/delete-user';
import { queueRoutes } from './http/routes/queue/queue-routes';
import {
  search,
  geoSearch,
  autocomplete,
  analytics,
} from './http/routes/search';
import { adminIndex } from './http/routes/search/admin-index';
import { indexDocument } from './http/routes/search/index-document';
import { bulkIndex } from './http/routes/search/bulk-index';
import { deleteDocument } from './http/routes/search/delete-document';

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
      const { QUEUE_NAMES } = await import('./services/jobs/queue/queue-manager');
      const { getQueue } = await import('./services/jobs/queue/queue-manager');

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
  app.register(getMe);
  app.register(createUser);
  app.register(listUsers);
  app.register(getUser);
  app.register(updateUser);
  app.register(deleteUser);
  app.register(queueRoutes);

  // Search routes (public read access)
  app.register(search);
  app.register(geoSearch);
  app.register(autocomplete);
  app.register(analytics);

  // Admin search routes (protected)
  app.register(indexDocument);
  app.register(bulkIndex);
  app.register(deleteDocument);
  app.register(adminIndex);

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
