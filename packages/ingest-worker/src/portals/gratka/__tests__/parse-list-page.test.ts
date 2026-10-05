import { describe, it, expect } from 'vitest';
import { parseListPage } from '../parse-list-page.js';

describe('Gratka parseListPage', () => {
  const sampleJsonLdHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Gratka.pl" },
            { "@type": "ListItem", "position": 2, "name": "Nieruchomości" },
            { "@type": "ListItem", "position": 3, "name": "Mieszkania na sprzedaż" },
            { "@type": "ListItem", "position": 4, "name": "mazowieckie" },
            { "@type": "ListItem", "position": 5, "name": "Warszawa" },
            { "@type": "ListItem", "position": 6, "name": "Mokotów" }
          ]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Mieszkania na sprzedaż Warszawa Mokotów",
          "offers": {
            "@type": "AggregateOffer",
            "offers": [
              {
                "@type": "Offer",
                "name": "Mieszkanie 2 pokoje 45 m² Mokotów",
                "price": "650000.00",
                "priceCurrency": "PLN",
                "url": "https://gratka.pl/nieruchomosci/mieszkanie-warszawa-mokotow/ob/31892341",
                "image": "https://img.gratka.pl/oferty/1/big.jpg",
                "itemOffered": {
                  "address": {
                    "addressLocality": "Warszawa",
                    "streetAddress": "ul. Puławska"
                  },
                  "numberOfRooms": 2,
                  "floorLevel": 3,
                  "floorSize": {
                    "value": "45.00"
                  }
                }
              }
            ]
          }
        }
        </script>
      </head>
      <body>
      </body>
    </html>
  `;

  const sampleDomHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <div class="teaserListing">
          <article class="teaser" data-cy="teaser">
            <a class="teaser__anchor" href="/nieruchomosci/mieszkanie-krakow-grzegorzki/ob/32991122" title="3 pokoje z balkonem Kraków Grzegórzki">
              <h2 class="teaser__title">3 pokoje z balkonem Kraków Grzegórzki</h2>
            </a>
            <p class="teaser__price">890 000 zł</p>
            <ul class="teaser__params">
              <li>62 m²</li>
              <li>3 pokoje</li>
              <li>2 piętro</li>
            </ul>
            <img class="teaser__image" src="https://img.gratka.pl/teaser2.jpg" alt="Zdjęcie oferty" />
          </article>
        </div>
      </body>
    </html>
  `;

  it('parses listings from JSON-LD schema', () => {
    const listings = parseListPage(sampleJsonLdHtml);
    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('gratka-31892341');
    expect(listings[0].portal).toBe('gratka');
    expect(listings[0].price).toBe(650000);
    expect(listings[0].areaSqm).toBe(45);
    expect(listings[0].roomsCount).toBe(2);
    expect(listings[0].city).toBe('Warszawa');
    expect(listings[0].district).toBe('Mokotów');
    expect(listings[0].street).toBe('ul. Puławska');
    expect(listings[0].images).toEqual(['https://img.gratka.pl/oferty/1/big.jpg']);
  });

  it('falls back to DOM parsing when JSON-LD is missing', () => {
    const listings = parseListPage(sampleDomHtml);
    expect(listings).toHaveLength(1);
    expect(listings[0].externalId).toBe('gratka-32991122');
    expect(listings[0].portal).toBe('gratka');
    expect(listings[0].price).toBe(890000);
    expect(listings[0].areaSqm).toBe(62);
    expect(listings[0].roomsCount).toBe(3);
    expect(listings[0].city).toBe('Kraków');
    expect(listings[0].images).toEqual(['https://img.gratka.pl/teaser2.jpg']);
  });

  it('handles empty or malformed HTML safely', () => {
    expect(parseListPage('')).toEqual([]);
    expect(parseListPage('<html><body>Brak ofert</body></html>')).toEqual([]);
  });
});
