import { describe, it, expect } from 'vitest';
import { parseListPage } from '../parse-list-page.js';

describe('Morizon parseListPage', () => {
  const sampleJsonLdHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Warszawa: mieszkania na sprzedaż",
          "url": "https://www.morizon.pl/mieszkania/warszawa/",
          "offers": {
            "@type": "AggregateOffer",
            "lowPrice": "416000.00",
            "highPrice": "6500000.00",
            "offers": [
              {
                "@context": "https://schema.org",
                "@type": "Offer",
                "name": "Mieszkanie na sprzedaż, 43 m² Nowa Praga, Wileńska",
                "price": "599000.00",
                "priceCurrency": "PLN",
                "url": "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-praga-polnoc-wilenska-42m2-mzn2046721837",
                "image": "https://img1.staticmorizon.com.pl/thumb/img1.jpg",
                "itemOffered": {
                  "@type": "Accommodation",
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "Polska",
                    "streetAddress": "Wileńska",
                    "addressLocality": "Nowa Praga"
                  },
                  "description": "Adres: Praga Północ, ul. Wileńska 18 Powierzchnia: 42,90 m2 Piętro: 6/7",
                  "numberOfRooms": 2,
                  "floorLevel": 6,
                  "floorSize": {
                    "@type": "QuantitativeValue",
                    "value": "42.90",
                    "unitCode": "MTK"
                  }
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Offer",
                "name": "Dom na sprzedaż, 150 m² Wawer",
                "price": "1200000.00",
                "priceCurrency": "PLN",
                "url": "https://www.morizon.pl/oferta/sprzedaz-dom-warszawa-wawer-150m2-mzn998877",
                "image": "https://img1.staticmorizon.com.pl/thumb/img2.jpg",
                "itemOffered": {
                  "@type": "Accommodation",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Wawer"
                  },
                  "numberOfRooms": 5,
                  "floorSize": {
                    "value": "150.0"
                  }
                }
              }
            ]
          }
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "morizon.pl" },
            { "@type": "ListItem", "position": 2, "name": "mieszkania na sprzedaż" },
            { "@type": "ListItem", "position": 3, "name": "mazowieckie" },
            { "@type": "ListItem", "position": 4, "name": "Warszawa" }
          ]
        }
        </script>
      </head>
      <body></body>
    </html>
  `;

  it('parses listings correctly from Schema.org JSON-LD AggregateOffer', () => {
    const listings = parseListPage(sampleJsonLdHtml);
    expect(listings).toHaveLength(2);

    const first = listings[0];
    expect(first.portal).toBe('morizon');
    expect(first.externalId).toBe('mzn2046721837');
    expect(first.title).toBe('Mieszkanie na sprzedaż, 43 m² Nowa Praga, Wileńska');
    expect(first.price).toBe(599000);
    expect(first.areaSqm).toBe(42.9);
    expect(first.pricePerSqm).toBe(13963);
    expect(first.roomsCount).toBe(2);
    expect(first.floor).toBe(6);
    expect(first.propertyType).toBe('apartment');
    expect(first.transactionType).toBe('sale');
    expect(first.city).toBe('Warszawa');
    expect(first.district).toBe('Nowa Praga');
    expect(first.images).toEqual(['https://img1.staticmorizon.com.pl/thumb/img1.jpg']);
    expect(first.description).toContain('Adres: Praga Północ');

    const second = listings[1];
    expect(second.portal).toBe('morizon');
    expect(second.externalId).toBe('mzn998877');
    expect(second.propertyType).toBe('house');
    expect(second.roomsCount).toBe(5);
    expect(second.price).toBe(1200000);
    expect(second.areaSqm).toBe(150);
    expect(second.pricePerSqm).toBe(8000);
  });

  it('falls back to DOM parsing when JSON-LD is missing', () => {
    const htmlDomFallback = `
      <html>
        <body>
          <div class="listing-item">
            <a href="/oferta/sprzedaz-mieszkanie-krakow-krowodrza-50m2-mzn112233">
              <h2>Mieszkanie 50m2 Kraków Krowodrza</h2>
            </a>
            <span class="price">450 000 zł</span>
            <img src="https://img1.staticmorizon.com.pl/thumb/thumb3.jpg" />
          </div>
        </body>
      </html>
    `;
    const listings = parseListPage(htmlDomFallback);
    expect(listings.length).toBeGreaterThanOrEqual(1);
    expect(listings[0].externalId).toBe('mzn112233');
    expect(listings[0].price).toBe(450000);
    expect(listings[0].propertyType).toBe('apartment');
  });

  it('returns empty array on empty input', () => {
    expect(parseListPage('')).toEqual([]);
  });
});
