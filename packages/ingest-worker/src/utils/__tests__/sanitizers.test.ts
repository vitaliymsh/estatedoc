import { describe, it, expect } from 'vitest';
import {
  sanitizeTitle,
  sanitizeStreet,
  sanitizeDescription,
} from '../sanitizers.js';

describe('Sanitizers', () => {
  describe('sanitizeTitle', () => {
    it('decodes HTML entities and normalizes whitespace', () => {
      const input = 'Mieszkanie &amp; gara&#x17C; &quot;Centrum&quot;   Warszawa';
      expect(sanitizeTitle(input)).toBe('Mieszkanie & garaż "Centrum" Warszawa');
    });

    it('strips duplicate specs like area and room count', () => {
      const input = 'Mieszkanie 70m2, 3 pokoje, Mokotów 70 m² | 3-pokojowe';
      expect(sanitizeTitle(input)).toBe('Mieszkanie, Mokotów');
    });

    it('cleans dangling delimiters and repeated punctuation', () => {
      const input = ' |; Mieszkanie w centrum - - Mokotów /: ';
      expect(sanitizeTitle(input)).toBe('Mieszkanie w centrum - Mokotów');
    });

    it('normalizes ALL-CAPS titles to sentence case', () => {
      const input = 'PIĘKNE MIESZKANIE W CENTRUM WARSZAWY!';
      expect(sanitizeTitle(input)).toBe('Piękne mieszkanie w centrum warszawy!');
    });

    it('keeps mixed case titles intact except trailing punctuation fixes', () => {
      const input = 'Nowoczesne Mieszkanie z Balkonem na Woli';
      expect(sanitizeTitle(input)).toBe('Nowoczesne Mieszkanie z Balkonem na Woli');
    });

    it('does not mangle titles with natural conjunctions or hyphen-comma combos', () => {
      expect(sanitizeTitle('2 pokoje lub 3, w parkowej części Ochoty')).toBe('2 pokoje lub 3, w parkowej części Ochoty');
      expect(sanitizeTitle('Bez prowizji - 68 m - 3 pokoje, balkon, 1 miejsce parkingowe')).toBe('Bez prowizji - balkon, 1 miejsce parkingowe');
      expect(sanitizeTitle('2 pokoje na - Warszawa Okęcie (ul. KOR) - Blisko Lotniska')).toBe('Warszawa Okęcie (ul. KOR) - Blisko Lotniska');
    });
  });

  describe('sanitizeStreet', () => {
    it('returns null for null, undefined, or empty string', () => {
      expect(sanitizeStreet(null)).toBeNull();
      expect(sanitizeStreet(undefined)).toBeNull();
      expect(sanitizeStreet('   ')).toBeNull();
    });

    it('prefixes "ul." when prefix is missing', () => {
      expect(sanitizeStreet('Marszałkowska')).toBe('ul. Marszałkowska');
      expect(sanitizeStreet('Marszałkowska 10/12')).toBe('ul. Marszałkowska 10/12');
    });

    it('standardizes "ul.", "al.", "pl.", "os."', () => {
      expect(sanitizeStreet('ulica Marszałkowska')).toBe('ul. Marszałkowska');
      expect(sanitizeStreet('ul. Marszałkowska')).toBe('ul. Marszałkowska');
      expect(sanitizeStreet('al Jerozolimskie')).toBe('al. Jerozolimskie');
      expect(sanitizeStreet('aleja Niepodległości')).toBe('al. Niepodległości');
      expect(sanitizeStreet('aleje Jerozolimskie')).toBe('al. Jerozolimskie');
      expect(sanitizeStreet('plac Bankowy')).toBe('pl. Bankowy');
      expect(sanitizeStreet('pl. Zbawiciela')).toBe('pl. Zbawiciela');
      expect(sanitizeStreet('osiedle Piastów')).toBe('os. Piastów');
      expect(sanitizeStreet('os. Szkolne')).toBe('os. Szkolne');
    });
  });

  describe('sanitizeDescription', () => {
    it('returns null for null, undefined or empty text', () => {
      expect(sanitizeDescription(null)).toBeNull();
      expect(sanitizeDescription(undefined)).toBeNull();
      expect(sanitizeDescription('   ')).toBeNull();
    });

    it('strips html tags, normalizes whitespace and decodes entities', () => {
      const input = '<p>Jasne <b>mieszkanie</b>.</p><br/><p>Super lokalizacja &amp; widok.</p>';
      const expected = 'Jasne mieszkanie.\n\nSuper lokalizacja & widok.';
      expect(sanitizeDescription(input)).toBe(expected);
    });

    it('formats bullet points cleanly', () => {
      const input = 'Atuty:\n* balkon\n- garaż\n• winda';
      const expected = 'Atuty:\n- balkon\n- garaż\n- winda';
      expect(sanitizeDescription(input)).toBe(expected);
    });
  });
});
