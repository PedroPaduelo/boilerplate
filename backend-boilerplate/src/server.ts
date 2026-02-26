import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRedis from '@fastify/redis';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { fastify } from 'fastify';
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

// Jobs
import { exampleWorker } from './services/jobs/worker/example-worker';
import { exampleQueue } from './services/jobs/queue/example-queue';

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.setErrorHandler(errorHandler);

// =============================================================================
// PLUGINS
// =============================================================================

// CORS
app.register(fastifyCors, {
  origin: true,
  credentials: true,
});

// Multipart (file uploads)
app.register(fastifyMultipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5,
    fields: 50,
  },
});

// Static files (uploads)
const uploadDir = env.UPLOAD_DIR
  ? path.resolve(env.UPLOAD_DIR)
  : path.resolve('./uploads');

console.log(`📂 Serving uploads from: ${uploadDir}`);

app.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/uploads/',
  decorateReply: false,
});

// Swagger documentation
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

// Redis
app.register(fastifyRedis, {
  host: env.REDIS_URL,
  password: env.REDIS_PASSWORD || undefined,
  port: env.REDIS_PORT,
  family: 4,
});

// JWT
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

// =============================================================================
// BULL BOARD (Queue monitoring)
// =============================================================================

const serverAdapter = new FastifyAdapter();

createBullBoard({
  queues: [new BullMQAdapter(exampleQueue)],
  serverAdapter,
});

serverAdapter.setBasePath('/queues');
app.register(serverAdapter.registerPlugin(), { prefix: '/queues' });

// =============================================================================
// HOOKS
// =============================================================================

app.addHook('onReady', () => {
  redisInstance.setClient(app.redis);
  console.log('✅ Redis client shared globally');
  console.log(`🔧 Example Worker ID: ${exampleWorker.id}`);
});

// =============================================================================
// ROUTES
// =============================================================================

// Health
app.register(healthCheck);

// Auth
app.register(authenticate);
app.register(getMe);

// Users
app.register(createUser);
app.register(listUsers);
app.register(getUser);
app.register(updateUser);
app.register(deleteUser);

// =============================================================================
// START SERVER
// =============================================================================

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then((address) => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Server is running on ${address}                       ║
║                                                            ║
║   📚 Docs:   ${address}/docs                               ║
║   📊 Queues: ${address}/queues                             ║
║   ❤️  Health: ${address}/health                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    setupSocketIO(app);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
