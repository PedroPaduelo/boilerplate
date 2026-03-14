import request from 'supertest';
import { createTestServer, generateTestToken } from './test-helper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Endpoint', () => {
  let server: any;
  let testUser: { id: string; email: string; password: string; name: string };

  beforeAll(async () => {
    server = await createTestServer();

    // Create a test user in the database
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await server.close();
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('should return JWT token with valid credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
    });

    it('should return 400 with invalid email', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with short password', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '12345',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with wrong credentials', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with non-existent user', async () => {
      const response = await request(server)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});
