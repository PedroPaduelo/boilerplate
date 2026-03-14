import { fastify } from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';

// Load environment variables
config({ path: join(__dirname, '../.env') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:4173';

// Dynamic imports for routes
async function importRoutes(app: any) {
  try {
    const {
      healthCheck,
    } = await import('../backend-boilerplate/src/http/routes/health/health-check');

    const {
      authenticate,
    } = await import('../backend-boilerplate/src/http/routes/auth/authenticate');

    const {
      listUsers,
    } = await import('../backend-boilerplate/src/http/routes/user/list-users');

    const {
      getUser,
    } = await import('../backend-boilerplate/src/http/routes/user/get-user');

    app.register(healthCheck);
    app.register(authenticate);
    app.register(listUsers);
    app.register(getUser);
  } catch (error) {
    console.error('Failed to import routes:', error);
    throw error;
  }
}

export async function createTestServer() {
  const app = fastify();

  // Register plugins
  app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  app.register(fastifyMultipart);

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
  });

  // Register routes dynamically
  await importRoutes(app);

  return app;
}

export const generateTestToken = (userId: string = 'test-user-id'): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
