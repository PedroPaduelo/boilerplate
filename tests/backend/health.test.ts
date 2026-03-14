import request from 'supertest';
import { createTestServer } from './test-helper';

describe('Health Endpoint', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /health should return 200 with status ok', async () => {
    const response = await request(server)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('GET /health should return correct body structure', async () => {
    const response = await request(server)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });
});
