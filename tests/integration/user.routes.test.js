const request = require('supertest');
const app = require('../../src/app');
const { pool, initDb } = require('../../src/config/db');

// These tests run the whole HTTP stack against a real PostgreSQL
// (DATABASE_URL). Locally: `docker compose up -d db` first.

beforeAll(async () => {
  await initDb();
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.query('DELETE FROM users');
  await pool.end();
});

describe('GET /health', () => {
  test('reports service and database as healthy', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('Users CRUD flow', () => {
  let userId;

  test('POST /api/users creates a user', async () => {
    const res = await request(app).post('/api/users').send({
      first_name: 'Grace',
      last_name: 'Hopper',
      city: 'Nueva York',
      address: 'Broadway 100',
      profession: 'Informática',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      first_name: 'Grace',
      last_name: 'Hopper',
      city: 'Nueva York',
      address: 'Broadway 100',
      profession: 'Informática',
    });
    expect(res.body.id).toBeDefined();
    userId = res.body.id;
  });

  test('POST /api/users rejects a user without required fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ city: 'Madrid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('GET /api/users returns the created user', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(userId);
  });

  test('GET /api/users/:id returns the user', async () => {
    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Grace');
  });

  test('PUT /api/users/:id updates only the provided fields', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ city: 'Arlington', profession: 'Contraalmirante' });

    expect(res.status).toBe(200);
    expect(res.body.city).toBe('Arlington');
    expect(res.body.profession).toBe('Contraalmirante');
    // Untouched fields keep their value
    expect(res.body.first_name).toBe('Grace');
  });

  test('DELETE /api/users/:id deletes the user', async () => {
    const res = await request(app).delete(`/api/users/${userId}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/users/${userId}`);
    expect(check.status).toBe(404);
  });

  test('GET /api/users/:id returns 404 for a missing user', async () => {
    const res = await request(app).get('/api/users/999999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/users/:id returns 404 for a missing user', async () => {
    const res = await request(app)
      .put('/api/users/999999')
      .send({ city: 'Madrid' });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/users/:id returns 404 for a missing user', async () => {
    const res = await request(app).delete('/api/users/999999');
    expect(res.status).toBe(404);
  });
});
