import { describe, it, expect } from 'vitest';
import { parseDetailPage } from '../parse-detail-page.js';

describe('Morizon parseDetailPage', () => {
  const sampleDetailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Offer",
          "description": "<p>Adres: Praga Północ, ul. Wileńska 18</p><p>Powierzchnia: 42,90 m2</p><p>Piętro: 6/7</p><p>Cena: 599 000 zł</p><p>Na sprzedaż dwupokojowe mieszkanie z odrębną kuchnią.</p>",
          "image": "https://img1.staticmorizon.com.pl/thumb/thumb-main.jpg",
          "name": "Mieszkanie na sprzedaż, 43 m² Nowa Praga, Wileńska",
          "category": "Mieszkanie na sprzedaż",
          "seller": {
            "@type": "Organization",
            "name": "HOMEMADE NIERUCHOMOŚCI",
            "telephone": "665 565 622"
          },
          "url": "https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-praga-polnoc-wilenska-42m2-mzn2046721837",
          "price": 599000,
          "priceCurrency": "PLN"
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
            { "@type": "ListItem", "position": 4, "name": "Warszawa" },
            { "@type": "ListItem", "position": 5, "name": "Praga-Północ" },
            { "@type": "ListItem", "position": 6, "name": "Nowa Praga" },
            { "@type": "ListItem", "position": 7, "name": "Wileńska" }
          ]
        }
        </script>
      </head>
      <body>
        <h1>Wysokie piętro z windą. Metro Szwedzka i Dworzec Wileński.</h1>
        <div class="gallery">
          <img src="https://img1.staticmorizon.com.pl/thumb/photo1.jpg" />
          <img src="https://img1.staticmorizon.com.pl/thumb/photo2.jpg" />
        </div>
      </body>
    </html>
  `;

  it('parses detail page with Schema.org Offer and Breadcrumbs', () => {
    const details = parseDetailPage(sampleDetailHtml);

    expect(details.description).toContain('Adres: Praga Północ');
    expect(details.description).not.toContain('<p>');
    expect(details.sellerType).toBe('agency');
    expect(details.city).toBe('Warszawa');
    expect(details.district).toBe('Praga-Północ');
    expect(details.floor).toBe(6);
    expect(details.totalFloors).toBe(7);
    expect(details.price).toBe(599000);
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/big/thumb-main.jpg');
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/big/photo1.jpg');
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/big/photo2.jpg');
    expect(details.metadata?.agencyName).toBe('HOMEMADE NIERUCHOMOŚCI');
    expect(details.metadata?.agencyPhone).toBe('665 565 622');
  });

  it('handles empty html gracefully', () => {
    const details = parseDetailPage('');
    expect(details.description).toBeNull();
    expect(details.images).toEqual([]);
    expect(details.floor).toBeNull();
    expect(details.totalFloors).toBeNull();
  });
});
