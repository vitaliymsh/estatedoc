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
          areaSqm: 30,
          pricePerSqm: 15000,
          images: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
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
    expect(body.items[0].price).toBe(450000);
    expect(body.items[0].areaSqm).toBe(30);
    expect(body.items[0].pricePerSqm).toBe(15000);
    expect(body.items[0].images).toEqual(['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']);

    const searchRes = await app.inject({
      method: 'GET',
      url: '/api/offers?q=Studio&sortBy=price_desc',
    });
    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.json().total).toBe(1);
    expect(searchRes.json().items[0].price).toBe(450000);
  });

  it('toOfferDto formats price/area as numbers and calculates pricePerSqm when null', async () => {
    await repo.upsertBatch([
      {
        portal: 'morizon',
        externalId: 'ext-calc-1',
        url: 'https://morizon.pl/ext-calc-1',
        title: 'Computed sqm price',
        city: 'Warszawa',
        price: '600000.00',
        areaSqm: '50.00',
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/offers/1',
    });

    expect(res.statusCode).toBe(200);
    const item = res.json();
    expect(item.price).toBe(600000);
    expect(item.areaSqm).toBe(50);
    expect(item.pricePerSqm).toBe(12000);
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

  it('POST /api/offers/check-existing returns existing IDs', async () => {
    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: 'ext-exist-1',
        url: 'https://sprzedajemy.pl/ext-exist-1',
        title: 'Offer 1',
        city: 'Warszawa',
      },
    ]);

    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/check-existing',
      payload: {
        portal: 'sprzedajemy',
        externalIds: ['ext-exist-1', 'ext-new-2'],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ existingIds: ['ext-exist-1'] });
  });

  it('sets ETag and Cache-Control, and returns 304 Not Modified on matching If-None-Match', async () => {
    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: 'ext-etag-1',
        url: 'https://sprzedajemy.pl/ext-etag-1',
        title: 'Offer ETag Test',
        city: 'Krakow',
      },
    ]);

    const firstRes = await app.inject({
      method: 'GET',
      url: '/api/offers/1',
    });
    expect(firstRes.statusCode).toBe(200);
    const etag = firstRes.headers['etag'];
    expect(etag).toBeDefined();
    expect(firstRes.headers['cache-control']).toBe('public, max-age=60');

    const conditionalRes = await app.inject({
      method: 'GET',
      url: '/api/offers/1',
      headers: {
        'if-none-match': etag as string,
      },
    });
    expect(conditionalRes.statusCode).toBe(304);
    expect(conditionalRes.body).toBe('');
  });

  it('POST /api/offers/search parses prompt and returns filtered offers', async () => {
    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: 'ext-krk-1',
        url: 'https://sprzedajemy.pl/krk-1',
        title: '3 pokoje Krowodrza',
        city: 'Kraków',
        price: 550000,
        roomsCount: 3,
      },
      {
        portal: 'sprzedajemy',
        externalId: 'ext-waw-1',
        url: 'https://sprzedajemy.pl/waw-1',
        title: 'Kawalerka Mokotów',
        city: 'Warszawa',
        price: 400000,
        roomsCount: 1,
      },
    ]);

    const mockParser = {
      parse: async () => ({
        city: 'Kraków',
        minRooms: 3,
        maxRooms: 3,
        maxPrice: 600000,
      }),
    };

    const aiApp = Fastify();
    await aiApp.register(offersRoutes, { prefix: '/api/offers', repository: repo, queryParser: mockParser });
    await aiApp.ready();

    const res = await aiApp.inject({
      method: 'POST',
      url: '/api/offers/search',
      payload: {
        prompt: '3 pokoje w Krakowie do 600k',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].city).toBe('Kraków');
    expect(body.items[0].roomsCount).toBe(3);
    expect(body.parsedFilters).toEqual({
      city: 'Kraków',
      minRooms: 3,
      maxRooms: 3,
      maxPrice: 600000,
    });
  });

  it('POST /api/offers/search rejects empty prompt', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/offers/search',
      payload: {
        prompt: '',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

