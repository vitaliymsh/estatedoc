import { describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { offersRoutes } from '../../src/routes/offers.js';
import { InMemoryOfferRepository } from '../../src/repositories/in-memory-offer.repository.js';

describe('Offers Routes', () => {
  let app: ReturnType<typeof Fastify>;
  let repo: InMemoryOfferRepository;

  beforeEach(async () => {
    repo = new InMemoryOfferRepository();
    app = Fastify();
    await app.register(offersRoutes, { prefix: '/api/offers', repository: repo });
    await app.ready();
  });

  it('GET /api/offers returns empty list when no offers exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/offers',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual({
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
  });

  it('POST /api/offers/batch and GET /api/offers lists offers', async () => {
    const batchRes = await app.inject({
      method: 'POST',
      url: '/api/offers/batch',
      payload: [
        {
          portal: 'sprzedajemy',
          externalId: 'ext-100',
          url: 'https://sprzedajemy.pl/ext-100',
          title: 'Warsaw Studio',
          city: 'Warszawa',
          price: 450000,
        },
      ],
    });

    expect(batchRes.statusCode).toBe(201);
    expect(batchRes.json()).toEqual({ inserted: 1, updated: 0 });

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/offers?city=Warszawa',
    });

    expect(getRes.statusCode).toBe(200);
    const body = getRes.json();
    expect(body.total).toBe(1);
    expect(body.items[0].externalId).toBe('ext-100');

    const searchRes = await app.inject({
      method: 'GET',
      url: '/api/offers?q=Studio&sortBy=price_desc',
    });
    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.json().total).toBe(1);
  });

  it('GET /api/offers/:id returns 404 for missing and 200 for existing', async () => {
    const notFoundRes = await app.inject({
      method: 'GET',
      url: '/api/offers/999',
    });
    expect(notFoundRes.statusCode).toBe(404);

    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: 'ext-200',
        url: 'https://sprzedajemy.pl/ext-200',
        title: 'Gdansk Flat',
        city: 'Gdansk',
      },
    ]);

    const foundRes = await app.inject({
      method: 'GET',
      url: '/api/offers/1',
    });
    expect(foundRes.statusCode).toBe(200);
    expect(foundRes.json().city).toBe('Gdansk');
  });

  it('POST /api/offers/batch rejects invalid payload', async () => {
    const invalidRes = await app.inject({
      method: 'POST',
      url: '/api/offers/batch',
      payload: [{ portal: '' }],
    });
    expect(invalidRes.statusCode).toBe(400);
  });
});
