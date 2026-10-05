import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapListingToBatchDto, pushOffersBatch, checkExistingOfferIds } from '../exporter.js';
import type { StandardListing } from '../portals/sprzedajemy/types.js';

describe('Exporter & Backend Client', () => {
  const sampleListing: StandardListing = {
    portal: 'sprzedajemy',
    externalId: 'ext-42',
    url: 'https://sprzedajemy.pl/oferta-42',
    title: 'Kawalerka w centrum',
    price: 350000,
    pricePerSqm: 10769,
    areaSqm: 32.5,
    roomsCount: 1,
    floor: 2,
    totalFloors: 5,
    transactionType: 'sale',
    propertyType: 'apartment',
    city: 'Warszawa',
    district: 'Śródmieście',
    sellerType: 'private',
    description: 'Świetna kawalerka po remoncie.',
    images: ['https://img.sprzedajemy.pl/42.jpg'],
    postedAt: '2026-03-01T12:00:00Z',
  };

  it('maps SprzedajemyListing to backend BatchOfferItem DTO', () => {
    const dto = mapListingToBatchDto(sampleListing);
    expect(dto.portal).toBe('sprzedajemy');
    expect(dto.externalId).toBe('ext-42');
    expect(dto.price).toBe(350000);
    expect(dto.pricePerSqm).toBe(10769);
    expect(dto.description).toBe('Świetna kawalerka po remoncie.');
    expect(dto.district).toBe('Śródmieście');
    expect(dto.floor).toBe(2);
    expect(dto.totalFloors).toBe(5);
    expect(dto.propertyType).toBe('apartment');
    expect(dto.transactionType).toBe('sale');
    expect(dto.sellerType).toBe('private');
    expect(dto.images).toEqual(['https://img.sprzedajemy.pl/42.jpg']);
    expect(dto.metadata).toEqual({
      postedAt: '2026-03-01T12:00:00Z',
    });
  });

  it('rounds float pricePerSqm when mapping listing', () => {
    const floatListing: StandardListing = {
      ...sampleListing,
      pricePerSqm: 12049.86,
    };
    const dto = mapListingToBatchDto(floatListing);
    expect(dto.pricePerSqm).toBe(12050);
  });

  it('prunes redundant top-level attributes from metadata and normalizes images', () => {
    const listingWithRedundantMeta: StandardListing = {
      ...sampleListing,
      images: ['  https://img.sprzedajemy.pl/1.jpg ', '', '   '],
      metadata: {
        street: 'ul. Marszałkowska',
        district: 'Śródmieście',
        city: 'Warszawa',
        price: 350000,
        imageUrl: 'https://img.sprzedajemy.pl/1.jpg',
        images: ['https://img.sprzedajemy.pl/1.jpg'],
        hasElevator: true,
        yearBuilt: 2010,
      },
    };

    const dto = mapListingToBatchDto(listingWithRedundantMeta);
    expect(dto.images).toEqual(['https://img.sprzedajemy.pl/1.jpg']);
    expect(dto.metadata).toEqual({
      hasElevator: true,
      yearBuilt: 2010,
      postedAt: '2026-03-01T12:00:00Z',
    });
  });

  it('pushes batch to backend API successfully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ inserted: 1, updated: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await pushOffersBatch([mapListingToBatchDto(sampleListing)], 'http://localhost:4000');
    expect(result).toEqual({ inserted: 1, updated: 0 });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/api/offers/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
  });

  it('chunks large batches and aggregates result', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ inserted: 2, updated: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ inserted: 1, updated: 1 }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const dtos = [
      mapListingToBatchDto({ ...sampleListing, externalId: '1' }),
      mapListingToBatchDto({ ...sampleListing, externalId: '2' }),
      mapListingToBatchDto({ ...sampleListing, externalId: '3' }),
    ];

    const result = await pushOffersBatch(dtos, 'http://localhost:4000', 2);
    expect(result).toEqual({ inserted: 3, updated: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws error when backend API returns non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    }));

    await expect(
      pushOffersBatch([mapListingToBatchDto(sampleListing)], 'http://localhost:4000')
    ).rejects.toThrow('Failed to push batch to backend (400): Bad Request');
  });

  it('checks existing offer IDs from backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ existingIds: ['ext-42'] }),
    });

    const existing = await checkExistingOfferIds('sprzedajemy', ['ext-42', 'ext-99'], 'http://localhost:4000', fetchMock as unknown as typeof fetch);
    expect(existing.has('ext-42')).toBe(true);
    expect(existing.has('ext-99')).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/api/offers/check-existing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal: 'sprzedajemy', externalIds: ['ext-42', 'ext-99'] }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
