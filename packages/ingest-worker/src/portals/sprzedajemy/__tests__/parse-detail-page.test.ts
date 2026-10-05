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
      marketType: 'wtórny',
      yearBuilt: 2018,
    });
  });

  it('handles empty or missing detail sections gracefully', () => {
    const details = parseDetailPage('<div>No details</div>');
    expect(details.description).toBeNull();
    expect(details.images).toEqual([]);
    expect(details.floor).toBeNull();
    expect(details.totalFloors).toBeNull();
  });
});
