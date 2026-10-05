import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { InMemoryOfferRepository } from '../src/repositories/in-memory-offer.repository.js';

describe('App Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      repository: new InMemoryOfferRepository(),
      logger: false,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('GET /api/offers is mounted', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/offers',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items).toEqual([]);
  });
});
