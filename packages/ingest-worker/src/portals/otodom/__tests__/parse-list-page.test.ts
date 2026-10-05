import { describe, it, expect } from 'vitest';
import { parseOtodomListPage } from '../parse-list-page.js';

describe('parseOtodomListPage', () => {
  it('parses HTML with __NEXT_DATA__ and returns structured listings and pagination', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script id="__NEXT_DATA__" type="application/json">
            {
              "props": {
                "pageProps": {
                  "data": {
                    "searchAds": {
                      "pagination": {
                        "totalItems": 1500,
                        "totalPages": 42,
                        "currentPage": 1,
                        "itemsPerPage": 36
                      },
                      "items": [
                        {
                          "id": 1001,
                          "title": "Nowoczesne 2 pokoje",
                          "slug": "nowoczesne-2-pokoje-ID1001",
                          "estate": "FLAT",
                          "transaction": "SELL",
                          "totalPrice": { "value": 500000, "currency": "PLN" },
                          "areaInSquareMeters": 45,
                          "roomsNumber": "TWO",
                          "location": {
                            "address": { "city": { "name": "Kraków" } }
                          },
                          "images": [{ "large": "https://img.cdn/1.jpg" }]
                        },
                        {
                          "id": 1002,
                          "title": "Apartament w centrum",
                          "slug": "apartament-w-centrum-ID1002",
                          "estate": "FLAT",
                          "transaction": "SELL",
                          "totalPrice": { "value": 850000, "currency": "PLN" },
                          "areaInSquareMeters": 70,
                          "roomsNumber": "THREE",
                          "location": {
                            "address": { "city": { "name": "Warszawa" } }
                          },
                          "images": [{ "large": "https://img.cdn/2.jpg" }]
                        }
                      ]
                    }
                  }
                }
              }
            }
          </script>
        </head>
      </html>
    `;

    const result = parseOtodomListPage(html);

    expect(result.totalItems).toBe(1500);
    expect(result.totalPages).toBe(42);
    expect(result.currentPage).toBe(1);
    expect(result.listings).toHaveLength(2);
    expect(result.listings[0].externalId).toBe('1001');
    expect(result.listings[0].city).toBe('Kraków');
    expect(result.listings[1].externalId).toBe('1002');
    expect(result.listings[1].city).toBe('Warszawa');
  });

  it('returns empty result when __NEXT_DATA__ is missing or has no searchAds', () => {
    const html = '<html><body>No data</body></html>';
    const result = parseOtodomListPage(html);

    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.listings).toEqual([]);
  });
});
