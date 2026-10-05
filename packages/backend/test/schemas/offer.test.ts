import { describe, it, expect } from 'vitest';
import { listOffersQuerySchema, getOfferParamsSchema, batchIngestOffersSchema } from '../../src/schemas/offer.js';

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
      sortBy: 'price_asc',
      limit: '50',
      offset: '10',
      city: 'Warszawa',
    });
    expect(result.q).toBe('kawalerka');
    expect(result.sortBy).toBe('price_asc');
    expect(result.minPrice).toBe(500000);
    expect(result.maxPrice).toBe(1000000);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(10);
    expect(result.city).toBe('Warszawa');
  });

  it('validates getOfferParamsSchema', () => {
    const valid = getOfferParamsSchema.parse({ id: '123' });
    expect(valid.id).toBe(123);
    expect(() => getOfferParamsSchema.parse({ id: 'invalid' })).toThrow();
  });

  it('validates batchIngestOffersSchema', () => {
    const payload = [
      {
        portal: 'sprzedajemy',
        externalId: 'ext-1',
        url: 'https://sprzedajemy.pl/oferta-1',
        title: 'Mieszkanie 50m2',
        city: 'Warszawa',
        price: 600000,
      },
    ];
    const result = batchIngestOffersSchema.parse(payload);
    expect(result).toHaveLength(1);
    expect(result[0].portal).toBe('sprzedajemy');
  });
});
