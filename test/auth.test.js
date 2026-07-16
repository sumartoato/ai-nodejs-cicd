const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is healthy');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('node');
  });
});

describe('Auth Routes', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should return error (DB unavailable or validation)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Without DB, it returns 500 (connection refused) — structure should be valid
      expect([400, 409, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('message');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Weak', email: 'weak@test.com', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should reject empty body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});

describe('Protected Routes', () => {
  it('GET /api/v1/users should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/users/me should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});
