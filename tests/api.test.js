const request = require('supertest');
const express = require('express');
const matchRoutes = require('../src/api/matches');

describe('Match API', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/matches', matchRoutes);
  });

  it('GET /api/matches should return matches list', async () => {
    const res = await request(app).get('/api/matches');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/matches/:id should handle not found', async () => {
    const res = await request(app).get('/api/matches/nonexistent-id');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success', false);
  });
});
