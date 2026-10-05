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

    await repo.upsertBatch([
      {
        portal: 'morizon',
        externalId: '3',
        url: 'https://morizon.pl/3',
        title: 'Mokotów Flat',
        city: 'Warszawa',
        district: 'Mokotów',
        roomsCount: 3,
        propertyType: 'apartment',
        transactionType: 'sale',
      },
    ]);

    const districtList = await repo.findAll({ district: 'Mokotów', limit: 10, offset: 0, sortBy: 'newest' });
    expect(districtList.total).toBe(1);
    expect(districtList.items[0].district).toBe('Mokotów');

    const roomsList = await repo.findAll({ minRooms: 3, limit: 10, offset: 0, sortBy: 'newest' });
    expect(roomsList.total).toBe(1);
    expect(roomsList.items[0].roomsCount).toBe(3);

    await repo.upsertBatch([
      {
        portal: 'morizon',
        externalId: '4',
        url: 'https://morizon.pl/4',
        title: 'Studio with elevator',
        city: 'Warszawa',
        price: '400000.00',
        areaSqm: '30.00',
        floor: 4,
        sellerType: 'private',
        metadata: { hasElevator: true, marketType: 'secondary', hasBalcony: true },
      },
      {
        portal: 'morizon',
        externalId: '5',
        url: 'https://morizon.pl/5',
        title: 'Big Developer House',
        city: 'Warszawa',
        price: '1200000.00',
        areaSqm: '150.00',
        sellerType: 'developer',
        metadata: { hasElevator: false, marketType: 'primary', hasParking: true },
      },
    ]);

    const areaFiltered = await repo.findAll({ minArea: 25, maxArea: 50, limit: 10, offset: 0, sortBy: 'newest' });
    expect(areaFiltered.items.some((i) => i.externalId === '4')).toBe(true);
    expect(areaFiltered.items.some((i) => i.externalId === '5')).toBe(false);

    const elevatorFiltered = await repo.findAll({ hasElevator: true, limit: 10, offset: 0, sortBy: 'newest' });
    expect(elevatorFiltered.items.some((i) => i.externalId === '4')).toBe(true);
    expect(elevatorFiltered.items.some((i) => i.externalId === '5')).toBe(false);

    const privateFiltered = await repo.findAll({ sellerType: 'private', limit: 10, offset: 0, sortBy: 'newest' });
    expect(privateFiltered.items.some((i) => i.externalId === '4')).toBe(true);
    expect(privateFiltered.items.some((i) => i.externalId === '5')).toBe(false);

    const sortedByArea = await repo.findAll({ limit: 10, offset: 0, sortBy: 'area_asc' });
    expect(sortedByArea.items[0].externalId).toBe('4');
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

  it('finds existing external IDs for portal', async () => {
    await repo.upsertBatch([
      { portal: 'sprzedajemy', externalId: 'a1', url: 'https://sprzedajemy.pl/a1', title: 'A1', city: 'Waw' },
      { portal: 'sprzedajemy', externalId: 'a2', url: 'https://sprzedajemy.pl/a2', title: 'A2', city: 'Waw' },
      { portal: 'morizon', externalId: 'm1', url: 'https://morizon.pl/m1', title: 'M1', city: 'Waw' },
    ]);

    const existing = await repo.findExistingExternalIds('sprzedajemy', ['a1', 'a3', 'm1']);
    expect(existing).toEqual(['a1']);
  });

  it('resolves English and shorthand city aliases in query', async () => {
    await repo.upsertBatch([
      { portal: 'sprzedajemy', externalId: 'w1', url: 'https://sprzedajemy.pl/w1', title: 'Warsaw Apt', city: 'Warszawa' },
      { portal: 'sprzedajemy', externalId: 'k1', url: 'https://sprzedajemy.pl/k1', title: 'Krakow Apt', city: 'Kraków' },
    ]);

    const warsawResult = await repo.findAll({ city: 'warsaw', limit: 10, offset: 0, sortBy: 'newest' });
    expect(warsawResult.total).toBe(1);
    expect(warsawResult.items[0].city).toBe('Warszawa');

    const cracowResult = await repo.findAll({ city: 'cracow', limit: 10, offset: 0, sortBy: 'newest' });
    expect(cracowResult.total).toBe(1);
    expect(cracowResult.items[0].city).toBe('Kraków');

    const wwaResult = await repo.findAll({ city: 'wwa', limit: 10, offset: 0, sortBy: 'newest' });
    expect(wwaResult.total).toBe(1);
    expect(wwaResult.items[0].city).toBe('Warszawa');
  });
});
