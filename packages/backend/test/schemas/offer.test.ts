import { describe, it, expect } from 'vitest';
import {
  listOffersQuerySchema,
  getOfferParamsSchema,
  batchIngestOffersSchema,
  checkExistingOffersSchema,
} from '../../src/schemas/offer.js';

describe('Offer Schemas', () => {
  it('parses valid list query params with defaults', () => {
    const result = listOffersQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('coerces numeric query params correctly', () => {
    const result = listOffersQuerySchema.parse({
      q: ' kawalerka ',
      minPrice: '500000',
      maxPrice: '1000000',
      minRooms: '2',
      maxRooms: '4',
      district: 'Mokotów',
      propertyType: 'apartment',
      transactionType: 'sale',
      sortBy: 'price_asc',
      limit: '50',
      offset: '10',
      city: 'Warszawa',
    });
    expect(result.q).toBe('kawalerka');
    expect(result.sortBy).toBe('price_asc');
    expect(result.minPrice).toBe(500000);
    expect(result.maxPrice).toBe(1000000);
    expect(result.minRooms).toBe(2);
    expect(result.maxRooms).toBe(4);
    expect(result.district).toBe('Mokotów');
    expect(result.propertyType).toBe('apartment');
    expect(result.transactionType).toBe('sale');
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(10);
    expect(result.city).toBe('Warszawa');
  });

  it('validates getOfferParamsSchema', () => {
    const valid = getOfferParamsSchema.parse({ id: '123' });
    expect(valid.id).toBe(123);
    expect(() => getOfferParamsSchema.parse({ id: 'invalid' })).toThrow();
  });

  it('validates batchIngestOffersSchema with standardized fields', () => {
    const payload = [
      {
        portal: 'sprzedajemy',
        externalId: 'ext-1',
        url: 'https://sprzedajemy.pl/oferta-1',
        title: 'Mieszkanie 50m2',
        city: 'Warszawa',
        district: 'Mokotów',
        street: 'Puławska',
        price: 600000,
        areaSqm: 50.5,
        roomsCount: 2,
        floor: 3,
        totalFloors: 5,
        propertyType: 'apartment',
        transactionType: 'sale',
        sellerType: 'private',
        pricePerSqm: '12000',
        images: ['https://img.jpg'],
        metadata: { plotSqm: 500 },
      },
    ];
    const result = batchIngestOffersSchema.parse(payload);
    expect(result).toHaveLength(1);
    expect(result[0].portal).toBe('sprzedajemy');
    expect(result[0].district).toBe('Mokotów');
    expect(result[0].floor).toBe(3);
    expect(result[0].pricePerSqm).toBe(12000);
    expect(result[0].images).toEqual(['https://img.jpg']);
  });

  it('rejects invalid image URLs in batchIngestOffersSchema', () => {
    const payload = [
      {
        portal: 'sprzedajemy',
        externalId: 'ext-1',
        url: 'https://sprzedajemy.pl/oferta-1',
        title: 'Mieszkanie 50m2',
        city: 'Warszawa',
        images: ['not-a-valid-url'],
      },
    ];
    expect(() => batchIngestOffersSchema.parse(payload)).toThrow();
  });

  it('validates checkExistingOffersSchema', () => {
    const payload = {
      portal: 'sprzedajemy',
      externalIds: ['ext-1', 'ext-2'],
    };
    const result = checkExistingOffersSchema.parse(payload);
    expect(result.portal).toBe('sprzedajemy');
    expect(result.externalIds).toEqual(['ext-1', 'ext-2']);
  });
});
