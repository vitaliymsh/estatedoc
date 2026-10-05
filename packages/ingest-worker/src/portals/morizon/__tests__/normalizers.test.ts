import { describe, it, expect } from 'vitest';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  extractCityAndDistrict,
  cleanDescriptionHtml,
} from '../normalizers.js';

describe('Morizon normalizers', () => {
  describe('calculatePricePerSqm', () => {
    it('calculates price per square meter correctly', () => {
      expect(calculatePricePerSqm(599000, 42.9)).toBe(13963);
      expect(calculatePricePerSqm(100000, 50)).toBe(2000);
    });

    it('returns null on invalid or zero values', () => {
      expect(calculatePricePerSqm(null, 50)).toBeNull();
      expect(calculatePricePerSqm(500000, 0)).toBeNull();
      expect(calculatePricePerSqm(500000, null)).toBeNull();
    });
  });

  describe('parseTransactionType', () => {
    it('detects sale transaction', () => {
      expect(parseTransactionType('https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa')).toBe('sale');
      expect(parseTransactionType('Mieszkanie na sprzedaż, 43 m²')).toBe('sale');
      expect(parseTransactionType('/mieszkania/warszawa/')).toBe('sale');
    });

    it('detects rent transaction', () => {
      expect(parseTransactionType('https://www.morizon.pl/oferta/wynajem-mieszkanie-krakow')).toBe('rent');
      expect(parseTransactionType('Mieszkanie do wynajęcia')).toBe('rent');
      expect(parseTransactionType('/do-wynajecia/mieszkania/')).toBe('rent');
    });

    it('defaults to null or sale if ambiguous', () => {
      expect(parseTransactionType('')).toBeNull();
    });
  });

  describe('parsePropertyType', () => {
    it('detects apartments', () => {
      expect(parsePropertyType('sprzedaz-mieszkanie-warszawa')).toBe('apartment');
      expect(parsePropertyType('Kawalerka w centrum')).toBe('apartment');
      expect(parsePropertyType('/mieszkania/warszawa/')).toBe('apartment');
    });

    it('detects houses', () => {
      expect(parsePropertyType('sprzedaz-dom-warszawa')).toBe('house');
      expect(parsePropertyType('Dom jednorodzinny')).toBe('house');
      expect(parsePropertyType('/domy/warszawa/')).toBe('house');
    });

    it('detects plots/land', () => {
      expect(parsePropertyType('sprzedaz-dzialka-warszawa')).toBe('land');
      expect(parsePropertyType('/dzialki/warszawa/')).toBe('land');
    });

    it('detects commercial properties', () => {
      expect(parsePropertyType('sprzedaz-lokal-biurowy')).toBe('commercial');
      expect(parsePropertyType('/lokale/warszawa/')).toBe('commercial');
    });

    it('detects garages', () => {
      expect(parsePropertyType('miejsce postojowe w garażu')).toBe('garage');
      expect(parsePropertyType('/garaze/warszawa/')).toBe('garage');
    });

    it('falls back to other', () => {
      expect(parsePropertyType('')).toBe('other');
    });
  });

  describe('extractCityAndDistrict', () => {
    it('extracts from breadcrumb hierarchy', () => {
      const breadcrumbs = [
        'morizon.pl',
        'mieszkania na sprzedaż',
        'mazowieckie',
        'Warszawa',
        'Praga-Północ',
        'Nowa Praga',
        'Wileńska',
      ];
      const result = extractCityAndDistrict(
        { addressLocality: 'Nowa Praga', streetAddress: 'Wileńska' },
        breadcrumbs
      );
      expect(result.city).toBe('Warszawa');
      expect(result.district).toBe('Praga-Północ');
      expect(result.street).toBe('Wileńska');
    });

    it('extracts district from addressLocality when city is known from breadcrumbs', () => {
      const breadcrumbs = ['morizon.pl', 'mazowieckie', 'Warszawa'];
      const result = extractCityAndDistrict(
        { addressLocality: 'Białołęka' },
        breadcrumbs
      );
      expect(result.city).toBe('Warszawa');
      expect(result.district).toBe('Białołęka');
    });

    it('extracts from address and title when breadcrumbs missing', () => {
      const result = extractCityAndDistrict(
        { addressLocality: 'Warszawa', streetAddress: 'Wileńska' },
        undefined,
        'Mieszkanie na sprzedaż Nowa Praga'
      );
      expect(result.city).toBe('Warszawa');
      expect(result.street).toBe('Wileńska');
    });

    it('falls back to addressLocality or Polska', () => {
      const result = extractCityAndDistrict({ addressLocality: 'Kraków' });
      expect(result.city).toBe('Kraków');
    });
  });

  describe('cleanDescriptionHtml', () => {
    it('strips html tags and cleans whitespace', () => {
      const html = '<p>Adres: Wileńska 18</p><p>Powierzchnia: 42,90 m2&nbsp;</p>';
      expect(cleanDescriptionHtml(html)).toBe('Adres: Wileńska 18 Powierzchnia: 42,90 m2');
    });

    it('returns null on empty input', () => {
      expect(cleanDescriptionHtml('')).toBeNull();
      expect(cleanDescriptionHtml(null)).toBeNull();
    });
  });
});
