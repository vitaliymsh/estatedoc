import { describe, it, expect } from 'vitest';
import { parseOtodomDetailPage } from '../parse-detail-page.js';
import type { StandardListing } from '../../../types.js';

describe('parseOtodomDetailPage', () => {
  const baseListing: StandardListing = {
    portal: 'otodom',
    externalId: '68482096',
    url: 'https://www.otodom.pl/pl/oferta/przestronne-i-72-2m2-ID4DljV',
    title: 'Przestronne I 72,2m2 I Loggia',
    price: 870000,
    pricePerSqm: 12049.86,
    areaSqm: 72.2,
    roomsCount: 4,
    floor: 6,
    totalFloors: null,
    transactionType: 'sale',
    propertyType: 'apartment',
    city: 'Pruszków',
    sellerType: 'agency',
    description: 'Krótki opis',
    images: ['https://img.cdn/search1.jpg'],
  };

  it('enriches listing with data from __NEXT_DATA__ ad object', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script id="__NEXT_DATA__" type="application/json">
            {
              "props": {
                "pageProps": {
                  "ad": {
                    "id": 68482096,
                    "title": "Przestronne I 72,2m2 I Loggia",
                    "description": "<p>Pełny opis lokalu po remoncie.</p>",
                    "location": {
                      "coordinates": { "latitude": 52.159, "longitude": 20.794 }
                    },
                    "target": {
                      "Build_year": "1990",
                      "Building_floors_num": "8",
                      "Extras_types": ["lift", "balcony"]
                    },
                    "characteristics": [
                      { "key": "rent", "value": "1450" },
                      { "key": "building_type", "value": "block" }
                    ],
                    "images": [
                      { "large": "https://img.cdn/detail1.jpg" },
                      { "large": "https://img.cdn/detail2.jpg" }
                    ]
                  }
                }
              }
            }
          </script>
        </head>
      </html>
    `;

    const enriched = parseOtodomDetailPage(html, baseListing);

    expect(enriched.description).toBe('Pełny opis lokalu po remoncie.');
    expect(enriched.totalFloors).toBe(8);
    expect(enriched.images).toEqual([
      'https://img.cdn/detail1.jpg',
      'https://img.cdn/detail2.jpg',
    ]);
    expect(enriched.metadata?.yearBuilt).toBe(1990);
    expect(enriched.metadata?.buildingType).toBe('block');
    expect(enriched.metadata?.rentExtra).toBe(1450);
    expect(enriched.metadata?.hasElevator).toBe(true);
    expect(enriched.metadata?.hasBalcony).toBe(true);
    expect(enriched.metadata?.latitude).toBe(52.159);
    expect(enriched.metadata?.longitude).toBe(20.794);
  });

  it('returns base listing unchanged if __NEXT_DATA__ or ad is missing', () => {
    const html = '<html><body>Not found</body></html>';
    const enriched = parseOtodomDetailPage(html, baseListing);

    expect(enriched).toEqual(baseListing);
  });
});
