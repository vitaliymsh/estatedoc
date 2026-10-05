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
          "priceCurrency": "PLN",
          "datePosted": "2026-08-15"
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
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/thumb/thumb-main.jpg');
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/thumb/photo1.jpg');
    expect(details.images).toContain('https://img1.staticmorizon.com.pl/thumb/photo2.jpg');
    expect(details.metadata?.agencyName).toBe('HOMEMADE NIERUCHOMOŚCI');
    expect(details.metadata?.agencyPhone).toBe('665 565 622');
    expect(details.metadata?.postedAt).toBe('2026-08-15');
  });

  it('parses Morizon DOM parameters table, amenities list, tags, and environmental cards', () => {
    const htmlWithDomTables = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="page-details__information-table">
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Typ budynku</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Kamienica</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Materiał budowlany</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Cegła</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Rok budowy</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">1953</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Rynek</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Wtórny</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Ogrzewanie</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Miejskie</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Forma własności</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Własność</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Czynsz</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">650 zł</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Stan mieszkania</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Do zamieszkania</span></div>
            </div>
            <div class="information-table__row" data-cy="informationTableRow">
              <div class="information-table__cell--label"><span data-cy="informationTableLabel">Rodzaj umowy</span></div>
              <div class="information-table__cell--value"><span data-cy="informationTableValue">Na wyłączność</span></div>
            </div>
          </div>

          <ul class="attribute-list__wrapper">
            <li class="icon-list-tile" data-cy="iconListTile">Winda</li>
            <li class="icon-list-tile" data-cy="iconListTile">Miejsce postojowe (parking naziemny)</li>
            <li class="icon-list-tile" data-cy="iconListTile">Piwnica</li>
            <li class="icon-list-tile" data-cy="iconListTile">Ogródek</li>
            <li class="icon-list-tile" data-cy="iconListTile">Taras</li>
          </ul>

          <ul class="tags__list">
            <li>cicha okolica</li>
            <li>sklep pod domem</li>
            <li>park w pobliżu</li>
          </ul>

          <div class="environmental-cards">
            <div>Jakość powietrza: Dobra</div>
            <div>Poziom hałasu: Niski</div>
          </div>
        </body>
      </html>
    `;

    const details = parseDetailPage(htmlWithDomTables);
    expect(details.metadata?.buildingType).toBe('kamienica');
    expect(details.metadata?.buildingMaterial).toBe('cegła');
    expect(details.metadata?.yearBuilt).toBe(1953);
    expect(details.metadata?.marketType).toBe('secondary');
    expect(details.metadata?.heating).toBe('miejskie');
    expect(details.metadata?.ownership).toBe('własność');
    expect(details.metadata?.condition).toBe('do zamieszkania');
    expect(details.metadata?.rentExtra).toBe(650);
    expect(details.metadata?.exclusiveOffer).toBe(true);
    expect(details.metadata?.hasElevator).toBe(true);
    expect(details.metadata?.hasParking).toBe(true);
    expect(details.metadata?.hasBasement).toBe(true);
    expect(details.metadata?.hasGarden).toBe(true);
    expect(details.metadata?.hasTerrace).toBe(true);
    expect(details.metadata?.tags).toEqual(['cicha okolica', 'sklep pod domem', 'park w pobliżu']);
    expect(details.metadata?.airQuality).toBe('Dobra');
    expect(details.metadata?.noiseLevel).toBe('Niski');
  });

  it('handles empty html gracefully', () => {
    const details = parseDetailPage('');
    expect(details.description).toBeNull();
    expect(details.images).toEqual([]);
    expect(details.floor).toBeNull();
    expect(details.totalFloors).toBeNull();
  });
});
