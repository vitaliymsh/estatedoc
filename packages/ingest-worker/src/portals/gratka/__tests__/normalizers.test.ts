import { describe, it, expect } from 'vitest';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  parseSellerType,
  extractLocation,
  extractFeatures,
  cleanDescriptionHtml,
} from '../normalizers.js';

describe('Gratka Normalizers', () => {
  describe('calculatePricePerSqm', () => {
    it('calculates rounded price per sqm', () => {
      expect(calculatePricePerSqm(600000, 50)).toBe(12000);
      expect(calculatePricePerSqm(599000, 42.9)).toBe(13963);
      expect(calculatePricePerSqm(null, 50)).toBeNull();
      expect(calculatePricePerSqm(500000, 0)).toBeNull();
    });
  });

  describe('parseTransactionType', () => {
    it('identifies sale vs rent', () => {
      expect(parseTransactionType('https://gratka.pl/nieruchomosci/mieszkanie-sprzedaz/ob/123')).toBe('sale');
      expect(parseTransactionType('Mieszkanie na sprzedaż Warszawa')).toBe('sale');
      expect(parseTransactionType('Wynajem mieszkania 2 pokoje')).toBe('rent');
      expect(parseTransactionType('/do-wynajecia/')).toBe('rent');
      expect(parseTransactionType('')).toBeNull();
    });
  });

  describe('parsePropertyType', () => {
    it('identifies property type from url or text', () => {
      expect(parsePropertyType('mieszkanie-warszawa')).toBe('apartment');
      expect(parsePropertyType('Dom wolnostojący')).toBe('house');
      expect(parsePropertyType('Działka budowlana')).toBe('land');
      expect(parsePropertyType('Lokal biurowy')).toBe('commercial');
      expect(parsePropertyType('Garaż podziemny')).toBe('garage');
      expect(parsePropertyType('inne')).toBe('other');
    });
  });

  describe('parseSellerType', () => {
    it('identifies seller type', () => {
      expect(parseSellerType('Biuro Nieruchomości Home')).toBe('agency');
      expect(parseSellerType('Spółka z o.o.')).toBe('company');
      expect(parseSellerType('')).toBeUndefined();
    });
  });

  describe('extractLocation', () => {
    it('extracts city, district and street from breadcrumbs and address object', () => {
      const breadcrumbs = ['Nieruchomości', 'Mieszkania na sprzedaż', 'mazowieckie', 'Warszawa', 'Mokotów'];
      const loc = extractLocation(breadcrumbs, {
        addressLocality: 'Warszawa',
        streetAddress: 'ul. Domaniewska 10',
      });
      expect(loc.city).toBe('Warszawa');
      expect(loc.district).toBe('Mokotów');
      expect(loc.street).toBe('ul. Domaniewska 10');
    });

    it('falls back gracefully to text when address is missing', () => {
      const loc = extractLocation([], undefined, 'Mieszkanie w Krakowie, Nowa Huta, ul. Zgody');
      expect(loc.city).toBe('Kraków');
      expect(loc.district).toBe('Nowa Huta');
      expect(loc.street).toBe('ul. Zgody');
    });
  });

  describe('extractFeatures', () => {
    it('detects amenities flags', () => {
      const amenities = ['Balkon', 'Winda', 'Garaż', 'Piwnica', 'Klimatyzacja', 'Meble'];
      const features = extractFeatures(amenities, 'Mieszkanie umeblowane z windą i klimatyzacją.');
      expect(features.hasElevator).toBe(true);
      expect(features.hasBalcony).toBe(true);
      expect(features.hasParking).toBe(true);
      expect(features.hasBasement).toBe(true);
      expect(features.hasAirConditioning).toBe(true);
      expect(features.isFurnished).toBe(true);
    });
  });

  describe('cleanDescriptionHtml', () => {
    it('strips unwanted html and excessive whitespace', () => {
      const html = '<p>Piękne mieszkanie.<br/>Blisko metra.</p><script>alert(1)</script>';
      expect(cleanDescriptionHtml(html)).toBe('Piękne mieszkanie.\nBlisko metra.');
      expect(cleanDescriptionHtml(null)).toBeNull();
    });
  });
});
