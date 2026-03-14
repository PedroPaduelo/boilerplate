import request from 'supertest';
import { createTestServer, generateTestToken } from './test-helper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Users Endpoints', () => {
  let server: any;
  let authToken: string;
  let testUsers: Array<{ id: string; email: string; name: string }>;

  beforeAll(async () => {
    server = await createTestServer();

    // Create test users in the database
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    testUsers = [];

    // Create multiple test users
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          password: hashedPassword,
          name: `Test User ${i}`,
          role: i === 1 ? 'ADMIN' : 'USER',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      testUsers.push(user);
    }

    // Generate auth token for the first user (ADMIN)
    authToken = generateTestToken(testUsers[0].id);
  });

  afterAll(async () => {
    await server.close();
    // Cleanup - delete all test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: testUsers.map((u) => u.email),
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /users', () => {
    it('should return list of users with authentication', async () => {
      const response = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should return paginated results', async () => {
      const response = await request(server)
        .get('/users?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(2);
    });

    it('should filter by role', async () => {
      const response = await request(server)
        .get('/users?role=ADMIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('ADMIN');
      });
    });

    it('should filter by isActive', async () => {
      const response = await request(server)
        .get('/users?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.users.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should search by name or email', async () => {
      const response = await request(server)
        .get('/users?search=User%201')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].name).toContain('User 1');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .get('/users')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should include user fields correctly', async () => {
      const response = await request(server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = response.body.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('lastLoginAt');
      expect(user).toHaveProperty('createdAt');
    });
  });

  describe('GET /users/:id', () => {
    it('should return specific user by ID with authentication', async () => {
      const userId = testUsers[1].id;
      const response = await request(server)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', testUsers[1].email);
      expect(response.body).toHaveProperty('name', testUsers[1].name);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(server)
        .get('/users/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .get(`/users/${testUsers[1].id}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return all user fields', async () => {
      const response = await request(server)
        .get(`/users/${testUsers[2].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = response.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('lastLoginAt');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });
  });
});
