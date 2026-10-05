import { describe, it, expect } from 'vitest';
import { parsePrice, parseArea, parseRooms, parseOfferId, parseSellerType } from '../parsers.js';

describe('sprzedajemy parsers', () => {
  describe('parsePrice', () => {
    it('parses standard PLN prices with spaces', () => {
      expect(parsePrice('1 600 000 zł')).toBe(1600000);
      expect(parsePrice('10 700 zł')).toBe(10700);
      expect(parsePrice('29150 zł')).toBe(29150);
      expect(parsePrice('1 230,50 zł')).toBe(1230.5);
    });

    it('returns null on invalid or negotiable strings', () => {
      expect(parsePrice('Do negocjacji')).toBeNull();
      expect(parsePrice('')).toBeNull();
      expect(parsePrice('Zapytaj o cenę')).toBeNull();
    });
  });

  describe('parseArea', () => {
    it('parses square meter strings', () => {
      expect(parseArea('140 m²')).toBe(140);
      expect(parseArea('Pow.: 134 m²')).toBe(134);
      expect(parseArea('107.6 m²')).toBe(107.6);
      expect(parseArea('121,82 m²')).toBe(121.82);
    });

    it('returns null on non-numeric area', () => {
      expect(parseArea('')).toBeNull();
      expect(parseArea('brak danych')).toBeNull();
    });
  });

  describe('parseRooms', () => {
    it('parses room count values', () => {
      expect(parseRooms('Pokoje: 6')).toBe(6);
      expect(parseRooms('6')).toBe(6);
      expect(parseRooms('2 pokoje')).toBe(2);
    });

    it('returns null when no number found', () => {
      expect(parseRooms('')).toBeNull();
      expect(parseRooms('kawalerka')).toBeNull();
    });
  });

  describe('parseOfferId', () => {
    it('extracts numeric offer id from element id or url', () => {
      expect(parseOfferId('offer-73849568')).toBe('73849568');
      expect(parseOfferId('/lokal-134m2-warszawa-4-1b8e55-6fpbc4-nr73849568')).toBe('73849568');
      expect(parseOfferId('https://sprzedajemy.pl/dom-nr73681286?source=feed')).toBe('73681286');
    });

    it('returns null when id pattern missing', () => {
      expect(parseOfferId('/wszystkie-ogloszenia')).toBeNull();
    });
  });

  describe('parseSellerType', () => {
    it('determines seller type from class or text', () => {
      expect(parseSellerType('seller-type-info seller-type-info--company')).toBe('company');
      expect(parseSellerType('seller-type-info seller-type-info--private')).toBe('private');
      expect(parseSellerType('seller-type-info seller-type-info--verified')).toBe('verified');
      expect(parseSellerType('other')).toBeUndefined();
    });
  });
});
