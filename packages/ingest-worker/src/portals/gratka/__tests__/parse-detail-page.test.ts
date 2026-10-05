import { describe, it, expect } from 'vitest';
import { parseDetailPage } from '../parse-detail-page.js';

describe('Gratka parseDetailPage', () => {
  const sampleDetailHtml = `
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
          "name": "Wyjątkowe mieszkanie na Mokotowie z tarasem",
          "offers": {
            "@type": "Offer",
            "price": "790000.00",
            "priceCurrency": "PLN",
            "url": "https://gratka.pl/nieruchomosci/mieszkanie-warszawa-mokotow/ob/31892341",
            "seller": {
              "@type": "Organization",
              "name": "Mokotów Nieruchomości Sp. z o.o."
            }
          }
        }
        </script>
      </head>
      <body>
        <h1 class="sticker__title">Wyjątkowe mieszkanie na Mokotowie z tarasem</h1>
        <span class="priceInfo__value">790 000 zł</span>

        <ul class="parameters__single">
          <li><span>Lokalizacja</span><b>Warszawa, Mokotów, ul. Domaniewska 14</b></li>
          <li><span>Powierzchnia w m2</span><b>58,5 m²</b></li>
          <li><span>Liczba pokoi</span><b>3</b></li>
          <li><span>Piętro</span><b>4/7</b></li>
          <li><span>Rok budowy</span><b>2019</b></li>
          <li><span>Typ zabudowy</span><b>Apartamentowiec</b></li>
          <li><span>Materiał budynku</span><b>Cegła</b></li>
          <li><span>Stan wykończenia</span><b>Do zamieszkania</b></li>
          <li><span>Ogrzewanie</span><b>Miejskie</b></li>
          <li><span>Rynek</span><b>Wtórny</b></li>
          <li><span>Czynsz</span><b>650 zł</b></li>
        </ul>

        <div class="parameters__grouped">
          <ul class="tags">
            <li>Balkon</li>
            <li>Winda</li>
            <li>Garaż</li>
            <li>Klimatyzacja</li>
            <li>Cicha okolica</li>
          </ul>
        </div>

        <div class="description__rolled">
          <p>Oferujemy na sprzedaż przestronne mieszkanie.</p>
          <p>Wykończone w wysokim standardzie. Umeblowane i gotowe do wprowadzenia.</p>
        </div>

        <div class="gallery">
          <img src="https://img.gratka.pl/foto1.jpg" />
          <img src="https://img.gratka.pl/foto2.jpg" />
        </div>
      </body>
    </html>
  `;

  it('parses detail specs, parameters, amenities and metadata', () => {
    const details = parseDetailPage(sampleDetailHtml);

    expect(details.title).toBe('Wyjątkowe mieszkanie na Mokotowie z tarasem');
    expect(details.price).toBe(790000);
    expect(details.areaSqm).toBe(58.5);
    expect(details.roomsCount).toBe(3);
    expect(details.floor).toBe(4);
    expect(details.totalFloors).toBe(7);
    expect(details.city).toBe('Warszawa');
    expect(details.district).toBe('Mokotów');
    expect(details.street).toBe('ul. Domaniewska 14');
    expect(details.sellerType).toBe('agency');
    expect(details.description).toContain('Oferujemy na sprzedaż przestronne mieszkanie.');
    expect(details.images).toEqual(['https://img.gratka.pl/foto1.jpg', 'https://img.gratka.pl/foto2.jpg']);

    expect(details.metadata.yearBuilt).toBe(2019);
    expect(details.metadata.buildingType).toBe('apartamentowiec');
    expect(details.metadata.buildingMaterial).toBe('cegła');
    expect(details.metadata.condition).toBe('do zamieszkania');
    expect(details.metadata.heating).toBe('miejskie');
    expect(details.metadata.marketType).toBe('secondary');
    expect(details.metadata.rentExtra).toBe(650);
    expect(details.metadata.hasElevator).toBe(true);
    expect(details.metadata.hasBalcony).toBe(true);
    expect(details.metadata.hasParking).toBe(true);
    expect(details.metadata.hasAirConditioning).toBe(true);
    expect(details.metadata.isFurnished).toBe(true);
    expect(details.metadata.tags).toContain('Cicha okolica');
  });

  it('filters out concatenated parent tag containers', () => {
    const htmlWithNestedTags = `
      <html><body>
        <div class="tags-container">
          <div class="tag-wrapper">
            <span class="tag">cicha okolica</span>
            <span class="tag">sklep pod domem</span>
            <span class="tag">park w pobliżu</span>
          </div>
        </div>
      </body></html>
    `;
    const details = parseDetailPage(htmlWithNestedTags);
    expect(details.metadata.tags).toEqual(['cicha okolica', 'sklep pod domem', 'park w pobliżu']);
    expect(details.metadata.tags).not.toContain('cicha okolicasklep pod domempark w pobliżu');
  });

  it('handles empty detail page safely', () => {
    const details = parseDetailPage('');
    expect(details.title).toBeUndefined();
    expect(details.images).toEqual([]);
    expect(details.metadata).toBeDefined();
  });
});
