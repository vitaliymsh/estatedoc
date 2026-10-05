import { describe, it, expect } from 'vitest';
import {
  parseExternalId,
  parsePrice,
  parseArea,
  parseRooms,
  parseFloor,
  buildOfferUrl,
  extractImageUrls,
} from '../parsers.js';

describe('Gratka Parsers', () => {
  describe('parseExternalId', () => {
    it('extracts ID from standard Gratka offer URL', () => {
      expect(
        parseExternalId('https://gratka.pl/nieruchomosci/mieszkanie-warszawa-mokotow/ob/31892341')
      ).toBe('gratka-31892341');
      expect(
        parseExternalId('/nieruchomosci/dom-krakow/ob/98765432')
      ).toBe('gratka-98765432');
    });

    it('handles numeric strings and nullish inputs', () => {
      expect(parseExternalId('31892341')).toBe('gratka-31892341');
      expect(parseExternalId('')).toBeNull();
      expect(parseExternalId('https://gratka.pl/nieruchomosci')).toBeNull();
    });
  });

  describe('parsePrice', () => {
    it('parses valid Polish currency price strings', () => {
      expect(parsePrice('650 000 zł')).toBe(650000);
      expect(parsePrice('1 250 500,50 zł')).toBe(1250500.5);
      expect(parsePrice(450000)).toBe(450000);
    });

    it('returns null for missing, non-numeric or negotiable prices', () => {
      expect(parsePrice('Zapytaj o cenę')).toBeNull();
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice(undefined)).toBeNull();
      expect(parsePrice('')).toBeNull();
    });
  });

  describe('parseArea', () => {
    it('parses square meter values with commas and decimals', () => {
      expect(parseArea('54,20 m²')).toBe(54.2);
      expect(parseArea('48.5 m2')).toBe(48.5);
      expect(parseArea('120 m kw')).toBe(120);
      expect(parseArea(60)).toBe(60);
    });

    it('returns null for invalid inputs', () => {
      expect(parseArea(null)).toBeNull();
      expect(parseArea('')).toBeNull();
    });
  });

  describe('parseRooms', () => {
    it('parses standard room numbers and keywords', () => {
      expect(parseRooms('3 pokoje')).toBe(3);
      expect(parseRooms('1 pokój')).toBe(1);
      expect(parseRooms('kawalerka')).toBe(1);
      expect(parseRooms(4)).toBe(4);
    });

    it('returns null for invalid room strings', () => {
      expect(parseRooms(null)).toBeNull();
      expect(parseRooms('')).toBeNull();
    });
  });

  describe('parseFloor', () => {
    it('parses floor levels including ground floor and fractions', () => {
      expect(parseFloor('parter', '4')).toEqual({ floor: 0, totalFloors: 4 });
      expect(parseFloor('3 / 5')).toEqual({ floor: 3, totalFloors: 5 });
      expect(parseFloor('4')).toEqual({ floor: 4, totalFloors: null });
      expect(parseFloor(2, 6)).toEqual({ floor: 2, totalFloors: 6 });
      expect(parseFloor('suterena')).toEqual({ floor: -1, totalFloors: null });
    });

    it('returns null when floor is unknown', () => {
      expect(parseFloor(null)).toEqual({ floor: null, totalFloors: null });
    });
  });

  describe('buildOfferUrl', () => {
    it('ensures absolute URL pointing to gratka.pl', () => {
      expect(buildOfferUrl('/nieruchomosci/mieszkanie/ob/123')).toBe('https://gratka.pl/nieruchomosci/mieszkanie/ob/123');
      expect(buildOfferUrl('https://gratka.pl/nieruchomosci/mieszkanie/ob/123')).toBe('https://gratka.pl/nieruchomosci/mieszkanie/ob/123');
    });
  });

  describe('extractImageUrls', () => {
    it('deduplicates and cleans image urls', () => {
      expect(extractImageUrls(['https://img.gratka.pl/1.jpg', 'https://img.gratka.pl/1.jpg', 'https://img.gratka.pl/2.jpg'])).toEqual([
        'https://img.gratka.pl/1.jpg',
        'https://img.gratka.pl/2.jpg',
      ]);
      expect(extractImageUrls('https://img.gratka.pl/single.jpg')).toEqual([
        'https://img.gratka.pl/single.jpg',
      ]);
      expect(extractImageUrls(null)).toEqual([]);
    });
  });
});
