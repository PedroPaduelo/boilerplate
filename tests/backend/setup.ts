import { Server } from 'fastify';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/testdb';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REDIS_URL = process.env.REDIS_URL || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.PORT = process.env.PORT || '4001';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:4173';
process.env.SWAGGER_USER = 'test';
process.env.SWAGGER_PASSWORD = 'test';

let server: Server | null = null;

export const testServer = async (): Promise<Server> => {
  if (server) return server;

  // Import the server creation function from the backend
  // Since the backend uses start() that calls fastify() directly, we need to modify approach
  const { fastify } = await import('fastify');
  const { Redis } = await import('ioredis');

  // Import routes and plugins
  const {
    healthCheck,
  } = await import('../backend-boilerplate/src/http/routes/health/health-check');

  const {
    authenticate,
  } = await import('../backend-boilerplate/src/http/routes/auth/authenticate');

  const {
    listUsers,
    getUser,
  } = await import('../backend-boilerplate/src/http/routes/user/index');

  const {
    auth,
  } = await import('../backend-boilerplate/src/middlewares/auth');

  const {
    errorHandler,
  } = await import('../backend-boilerplate/src/http/error-handler');

  const { env } = await import('../backend-boilerplate/src/lib/env');

  // Create app instance
  const app = fastify().withTypeProvider();

  // Basic setup
  app.setErrorHandler(errorHandler);

  // Register JWT
  const fastifyJwt = (await import('@fastify/jwt')).default;
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  // Register auth middleware
  app.register(auth);

  // Register routes
  app.register(healthCheck);
  app.register(authenticate);
  app.register(listUsers);
  app.register(getUser);

  server = app;
  return server;
};

export const closeServer = async (): Promise<void> => {
  if (server) {
    await server.close();
    server = null;
  }
};
