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
        "name": "Gratka Warszawa",
        "offers": {
          "@type": "AggregateOffer",
          "offers": [
            {
              "@type": "Offer",
              "name": "Mieszkanie 50m2",
              "price": "500000",
              "url": "https://gratka.pl/nieruchomosci/mieszkanie-warszawa/ob/123456",
              "image": "https://img.gratka.pl/1.jpg",
              "itemOffered": {
                "numberOfRooms": 2,
                "floorSize": { "value": "50" },
                "address": { "addressLocality": "Warszawa" }
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
        "@context": "https://schema.org",
        "@type": "Offer",
        "name": "Mieszkanie 50m2 z balkonem",
        "price": "500000",
        "url": "https://gratka.pl/nieruchomosci/mieszkanie-warszawa/ob/123456",
        "seller": {
          "@type": "Organization",
          "name": "Biuro Nieruchomości"
        }
      }
      </script>
    </head>
    <body>
      <h1 class="sticker__title">Mieszkanie 50m2 z balkonem</h1>
      <span class="priceInfo__value">500 000 zł</span>
      <div class="description__rolled"><p>Piękne mieszkanie z windą.</p></div>
      <div class="gallery"><img src="https://img.gratka.pl/detail.jpg" /></div>
    </body>
  </html>
`;

describe('Gratka fetch-listings', () => {
  it('fetches listings page and parses offers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockListHtml,
    });

    const listings = await fetchListingsPage({ fetchFn: mockFetch as unknown as typeof fetch });
    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('gratka-123456');
    expect(listings[0].price).toBe(500000);
  });

  it('fetches listing details and enriches metadata', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockDetailHtml,
    });

    const details = await fetchListingDetails('https://gratka.pl/nieruchomosci/mieszkanie-warszawa/ob/123456', mockFetch as unknown as typeof fetch);
    expect(details.title).toBe('Mieszkanie 50m2 z balkonem');
    expect(details.description).toContain('Piękne mieszkanie z windą.');
    expect(details.metadata?.hasElevator).toBe(true);
  });

  it('orchestrates fetchAllListings and enriches offers', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/ob/')) {
        return Promise.resolve({
          ok: true,
          text: async () => mockDetailHtml,
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () => mockListHtml,
      });
    });

    const results = await fetchAllListings({
      maxPages: 1,
      limit: 1,
      delayMs: 0,
      enrichDetails: true,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(results).toHaveLength(1);
    expect(results[0].externalId).toBe('gratka-123456');
    expect(results[0].metadata?.hasElevator).toBe(true);
    expect(results[0].images).toContain('https://img.gratka.pl/detail.jpg');
  });

  it('throws when HTTP request fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchListingsPage({ fetchFn: mockFetch as unknown as typeof fetch })).rejects.toThrow('HTTP 500');
  });
});
