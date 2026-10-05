import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryOfferRepository } from '../../src/repositories/in-memory-offer.repository.js';
import type { NewOffer } from '../../src/db/schema.js';

describe('InMemoryOfferRepository', () => {
  let repo: InMemoryOfferRepository;

  beforeEach(() => {
    repo = new InMemoryOfferRepository();
  });

  it('upserts and retrieves offers', async () => {
    const offer: NewOffer = {
      portal: 'sprzedajemy',
      externalId: '123',
      url: 'https://sprzedajemy.pl/123',
      title: 'Flat in Warsaw',
      city: 'Warszawa',
      price: '500000.00',
    };

    const res = await repo.upsertBatch([offer]);
    expect(res.inserted).toBe(1);

    const list = await repo.findAll({ limit: 20, offset: 0 });
    expect(list.total).toBe(1);
    expect(list.items[0].externalId).toBe('123');
  });

  it('filters by city and price', async () => {
    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: '1',
        url: 'https://sprzedajemy.pl/1',
        title: 'Cheap Warsaw',
        city: 'Warszawa',
        price: '300000.00',
      },
      {
        portal: 'sprzedajemy',
        externalId: '2',
        url: 'https://sprzedajemy.pl/2',
        title: 'Expensive Krakow',
        city: 'Krakow',
        price: '800000.00',
      },
    ]);

    const warsawList = await repo.findAll({ city: 'Warszawa', limit: 10, offset: 0, sortBy: 'newest' });
    expect(warsawList.total).toBe(1);
    expect(warsawList.items[0].city).toBe('Warszawa');

    const cheapList = await repo.findAll({ maxPrice: 400000, limit: 10, offset: 0, sortBy: 'newest' });
    expect(cheapList.total).toBe(1);

    const textSearchList = await repo.findAll({ q: 'Expensive', limit: 10, offset: 0, sortBy: 'newest' });
    expect(textSearchList.total).toBe(1);
    expect(textSearchList.items[0].city).toBe('Krakow');

    const sortedAsc = await repo.findAll({ limit: 10, offset: 0, sortBy: 'price_asc' });
    expect(sortedAsc.items[0].city).toBe('Warszawa');
    expect(sortedAsc.items[1].city).toBe('Krakow');

    const sortedDesc = await repo.findAll({ limit: 10, offset: 0, sortBy: 'price_desc' });
    expect(sortedDesc.items[0].city).toBe('Krakow');
    expect(sortedDesc.items[1].city).toBe('Warszawa');
  });

  it('finds offer by id', async () => {
    await repo.upsertBatch([
      {
        portal: 'sprzedajemy',
        externalId: '10',
        url: 'https://sprzedajemy.pl/10',
        title: 'Flat 10',
        city: 'Gdansk',
      },
    ]);

    const found = await repo.findById(1);
    expect(found).not.toBeNull();
    expect(found?.city).toBe('Gdansk');

    const notFound = await repo.findById(999);
    expect(notFound).toBeNull();
  });
});
