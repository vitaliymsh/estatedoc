import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapListingToBatchDto, pushOffersBatch } from '../exporter.js';
import type { SprzedajemyListing } from '../portals/sprzedajemy/types.js';

describe('Exporter & Backend Client', () => {
  const sampleListing: SprzedajemyListing = {
    portal: 'sprzedajemy',
    externalId: 'ext-42',
    url: 'https://sprzedajemy.pl/oferta-42',
    title: 'Kawalerka w centrum',
    price: 350000,
    areaSqm: 32.5,
    roomsCount: 1,
    city: 'Warszawa',
    district: 'Śródmieście',
    sellerType: 'private',
    imageUrl: 'https://img.sprzedajemy.pl/42.jpg',
    postedAt: '2026-03-01T12:00:00Z',
  };

  it('maps SprzedajemyListing to backend BatchOfferItem DTO', () => {
    const dto = mapListingToBatchDto(sampleListing);
    expect(dto.portal).toBe('sprzedajemy');
    expect(dto.externalId).toBe('ext-42');
    expect(dto.price).toBe(350000);
    expect(dto.metadata).toEqual({
      district: 'Śródmieście',
      sellerType: 'private',
      imageUrl: 'https://img.sprzedajemy.pl/42.jpg',
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
