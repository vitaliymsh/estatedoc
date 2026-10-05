import { describe, it, expect, vi } from 'vitest';
import {
  fetchListingsPage,
  fetchListingDetails,
  fetchAllListings,
} from '../fetch-listings.js';

const mockListHtml = `
  <html>
    <head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Warszawa",
        "offers": {
          "@type": "AggregateOffer",
          "offers": [
            {
              "@context": "https://schema.org",
              "@type": "Offer",
              "name": "Mieszkanie 50m2",
              "price": "500000",
              "url": "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-mzn111",
              "itemOffered": {
                "@type": "Accommodation",
                "floorSize": { "value": "50" }
              }
            }
          ]
        }
      }
      </script>
    </head>
    <body></body>
  </html>
`;

const mockDetailHtml = `
  <html>
    <head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Offer",
        "description": "<p>Pełny opis lokalu</p><p>Piętro: 3/5</p>",
        "image": "https://img1.staticmorizon.com.pl/thumb/detail1.jpg",
        "name": "Mieszkanie 50m2",
        "seller": {
          "@type": "Organization",
          "name": "Biuro Nieruchomości"
        },
        "url": "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-mzn111",
        "price": 500000
      }
      </script>
    </head>
    <body></body>
  </html>
`;

describe('Morizon fetch-listings', () => {
  it('fetches and parses a single list page', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockListHtml,
    });

    const listings = await fetchListingsPage({
      categoryPath: '/mieszkania/warszawa',
      page: 1,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.morizon.pl/mieszkania/warszawa/',
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('mzn111');
  });

  it('fetches and parses listing details', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDetailHtml,
    });

    const details = await fetchListingDetails(
      'https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-mzn111',
      mockFetch as unknown as typeof fetch
    );

    expect(details.description).toBe('Pełny opis lokalu Piętro: 3/5');
    expect(details.sellerType).toBe('agency');
    expect(details.floor).toBe(3);
    expect(details.totalFloors).toBe(5);
  });

  it('fetches all listings and enriches details when requested', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockListHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockDetailHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<html></html>',
      });

    const listings = await fetchAllListings({
      categoryPath: '/mieszkania/warszawa',
      maxPages: 2,
      delayMs: 0,
      enrichDetails: true,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('mzn111');
    expect(listings[0].description).toBe('Pełny opis lokalu Piętro: 3/5');
    expect(listings[0].sellerType).toBe('agency');
    expect(listings[0].floor).toBe(3);
  });

  it('skips detail fetch for known existing IDs when enrichDetails is true', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => mockListHtml,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ existingIds: ['mzn111'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<html></html>',
      });

    const listings = await fetchAllListings({
      categoryPath: '/mieszkania/warszawa',
      maxPages: 2,
      delayMs: 0,
      enrichDetails: true,
      backendUrl: 'http://localhost:4000',
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('mzn111');
    expect(listings[0].description).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
