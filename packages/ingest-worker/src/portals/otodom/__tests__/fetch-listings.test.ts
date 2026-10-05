import { describe, it, expect, vi } from 'vitest';
import {
  fetchOtodomListPage,
  fetchOtodomDetails,
  fetchAllListings,
} from '../fetch-listings.js';
import type { StandardListing } from '../../../types.js';

describe('otodom fetch-listings', () => {
  const sampleListHtml = `
    <html><head><script id="__NEXT_DATA__" type="application/json">
      {
        "props": {
          "pageProps": {
            "data": {
              "searchAds": {
                "pagination": { "totalPages": 2, "totalItems": 2 },
                "items": [
                  {
                    "id": 101,
                    "title": "Flat 1",
                    "slug": "flat-1-ID101",
                    "estate": "FLAT",
                    "transaction": "SELL",
                    "totalPrice": { "value": 400000, "currency": "PLN" },
                    "location": { "address": { "city": { "name": "Warszawa" } } },
                    "images": [{ "large": "https://img.cdn/1.jpg" }]
                  }
                ]
              }
            }
          }
        }
      }
    </script></head></html>
  `;

  const sampleDetailHtml = `
    <html><head><script id="__NEXT_DATA__" type="application/json">
      {
        "props": {
          "pageProps": {
            "ad": {
              "id": 101,
              "title": "Flat 1",
              "description": "Full enriched description",
              "target": { "Build_year": "2020" },
              "images": [{ "large": "https://img.cdn/detail1.jpg" }]
            }
          }
        }
      }
    </script></head></html>
  `;

  it('fetchOtodomListPage calls fetch and returns parsed listings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sampleListHtml),
    });

    const result = await fetchOtodomListPage({
      categoryPath: '/pl/wyniki/sprzedaz/mieszkanie/warszawa',
      page: 1,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/warszawa?page=1&limit=36',
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].externalId).toBe('101');
  });

  it('fetchOtodomDetails enriches a base listing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sampleDetailHtml),
    });

    const baseListing: StandardListing = {
      portal: 'otodom',
      externalId: '101',
      url: 'https://www.otodom.pl/pl/oferta/flat-1-ID101',
      title: 'Flat 1',
      price: 400000,
      pricePerSqm: null,
      areaSqm: 50,
      roomsCount: 2,
      floor: null,
      totalFloors: null,
      transactionType: 'sale',
      propertyType: 'apartment',
      city: 'Warszawa',
      images: ['https://img.cdn/1.jpg'],
      description: null,
    };

    const enriched = await fetchOtodomDetails(
      baseListing,
      mockFetch as unknown as typeof fetch
    );

    expect(enriched.description).toBe('Full enriched description');
    expect(enriched.metadata?.yearBuilt).toBe(2020);
  });

  it('fetchAllListings respects maxPages and limit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(sampleListHtml),
    });

    const listings = await fetchAllListings({
      maxPages: 1,
      limit: 1,
      delayMs: 0,
      enrichDetails: false,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('101');
  });

  it('throws error when search page returns non-200 HTTP status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    await expect(
      fetchOtodomListPage({ fetchFn: mockFetch as unknown as typeof fetch })
    ).rejects.toThrow('HTTP 403');
  });
});
