import { describe, it, expect } from 'vitest';
import { extractJsonLd, parsePrice, parseArea, parseRooms, calculatePricePerSqm } from '../parsers.js';

describe('utils/parsers', () => {
  it('extracts JSON-LD script objects from HTML', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">{"@type": "Product", "name": "Flat 1"}</script>
          <script type="application/ld+json">{"@type": "BreadcrumbList", "items": []}</script>
          <script type="application/ld+json">{invalid json</script>
        </head>
      </html>
    `;
    const result = extractJsonLd<{ '@type': string; name?: string }>(html);
    expect(result).toHaveLength(2);
    expect(result[0]['@type']).toBe('Product');
    expect(result[0].name).toBe('Flat 1');
    expect(result[1]['@type']).toBe('BreadcrumbList');
  });

  it('handles empty html and missing json-ld', () => {
    expect(extractJsonLd('')).toEqual([]);
    expect(extractJsonLd('<html><body>No JSON-LD</body></html>')).toEqual([]);
  });

  it('parses price, area, rooms, and pricePerSqm', () => {
    expect(parsePrice('500 000 zł')).toBe(500000);
    expect(parseArea('50,5 m²')).toBe(50.5);
    expect(parseRooms('3 pokoje')).toBe(3);
    expect(parseRooms('kawalerka', true)).toBe(1);
    expect(calculatePricePerSqm(500000, 50)).toBe(10000);
  });
});
