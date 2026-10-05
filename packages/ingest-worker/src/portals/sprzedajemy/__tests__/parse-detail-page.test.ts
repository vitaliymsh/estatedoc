import { describe, it, expect } from 'vitest';
import { parseDetailPage } from '../parse-detail-page.js';

const mockDetailHtml = `
<div id="detailedInformations" data-offer-id="73849568">
  <div class="attributes-box">
    <ul class="attribute-list">
      <li class="item"><span>Oferta od</span><strong>firmy</strong></li>
      <li class="item"><span>Powierzchnia</span><strong>134 m²</strong></li>
      <li class="item"><span>Piętro</span><strong>3/5</strong></li>
      <li class="item"><span>Rynek</span><strong>wtórny</strong></li>
      <li class="item"><span>Rok budowy</span><strong>2018</strong></li>
    </ul>
  </div>
  <div class="offerDescription">
    <span>
      Piękne i przestronne biuro na Woli w pobliżu stacji metra.
      Klimatyzacja, recepcja, winda.
    </span>
  </div>
  <div class="gallery-wrapper">
    <img src="https://thumbs.img-sprzedajemy.pl/1000x901c/b4/38/78/img1.jpg" />
    <img src="https://thumbs.img-sprzedajemy.pl/1000x901c/b4/38/78/img2.jpg" />
  </div>
</div>
`;

describe('parseDetailPage', () => {
  it('extracts full description, attributes, and image gallery', () => {
    const details = parseDetailPage(mockDetailHtml);

    expect(details.description).toContain('Piękne i przestronne biuro na Woli');
    expect(details.description).toContain('Klimatyzacja, recepcja, winda.');
    expect(details.floor).toBe(3);
    expect(details.totalFloors).toBe(5);
    expect(details.images).toEqual([
      'https://thumbs.img-sprzedajemy.pl/1000x901c/b4/38/78/img1.jpg',
      'https://thumbs.img-sprzedajemy.pl/1000x901c/b4/38/78/img2.jpg',
    ]);
    expect(details.metadata).toMatchObject({
      marketType: 'secondary',
      yearBuilt: 2018,
    });
  });

  it('extracts building material, building type, rent and deposit from Sprzedajemy', () => {
    const htmlWithSpecs = `
      <div id="detailedInformations">
        <div class="attributes-box">
          <ul class="attribute-list">
            <li class="item"><span>Zabudowa</span><strong>kamienica</strong></li>
            <li class="item"><span>Materiał budynku</span><strong>cegła</strong></li>
            <li class="item"><span>Ogrzewanie</span><strong>sieć</strong></li>
            <li class="item"><span>Forma własności</span><strong>własność</strong></li>
          </ul>
        </div>
        <div class="offer-date">Dodane: <strong>2026-04-10</strong></div>
        <div class="offerDescription">
          <span>
            3 000 zł - najem. Czynsz administracyjny: 1200 zł. Kaucja: 3500 zł.
            W mieszkaniu jest winda, balkon, prywatny ogródek oraz taras i miejsce parkingowe.
          </span>
        </div>
      </div>
    `;

    const details = parseDetailPage(htmlWithSpecs);
    expect(details.metadata?.buildingType).toBe('kamienica');
    expect(details.metadata?.buildingMaterial).toBe('cegła');
    expect(details.metadata?.heating).toBe('miejskie');
    expect(details.metadata?.ownership).toBe('własność');
    expect(details.metadata?.rentExtra).toBe(1200);
    expect(details.metadata?.deposit).toBe(3500);
    expect(details.metadata?.hasElevator).toBe(true);
    expect(details.metadata?.hasBalcony).toBe(true);
    expect(details.metadata?.hasGarden).toBe(true);
    expect(details.metadata?.hasTerrace).toBe(true);
    expect(details.metadata?.hasParking).toBe(true);
    expect(details.metadata?.postedAt).toBe('2026-04-10');
  });

  it('handles empty or missing detail sections gracefully', () => {
    const details = parseDetailPage('<div>No details</div>');
    expect(details.description).toBeNull();
    expect(details.images).toEqual([]);
    expect(details.floor).toBeNull();
    expect(details.totalFloors).toBeNull();
  });
});
