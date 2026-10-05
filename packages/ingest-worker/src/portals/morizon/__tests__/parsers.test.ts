import { describe, it, expect } from 'vitest';
import {
  parsePrice,
  parseArea,
  parseRooms,
  parseFloor,
  parseExternalId,
  parseSellerType,
} from '../parsers.js';

describe('Morizon parsers', () => {
  describe('parsePrice', () => {
    it('handles numeric input', () => {
      expect(parsePrice(599000)).toBe(599000);
    });

    it('handles string numbers with decimals', () => {
      expect(parsePrice('599000.00')).toBe(599000);
      expect(parsePrice('1649000.50')).toBe(1649000.5);
    });

    it('handles Polish currency formatted string', () => {
      expect(parsePrice('599 000 zł')).toBe(599000);
      expect(parsePrice('1 250 000,00 PLN')).toBe(1250000);
    });

    it('returns null for invalid inputs', () => {
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice('')).toBeNull();
      expect(parsePrice('zapytaj o cenę')).toBeNull();
    });
  });

  describe('parseArea', () => {
    it('handles numeric input', () => {
      expect(parseArea(42.9)).toBe(42.9);
    });

    it('handles string area representations', () => {
      expect(parseArea('42.90')).toBe(42.9);
      expect(parseArea('42,90 m²')).toBe(42.9);
      expect(parseArea('100 mkw')).toBe(100);
      expect(parseArea('Powierzchnia: 55,5 m2')).toBe(55.5);
    });

    it('returns null for invalid inputs', () => {
      expect(parseArea(null)).toBeNull();
      expect(parseArea('')).toBeNull();
    });
  });

  describe('parseRooms', () => {
    it('handles numeric and string numbers', () => {
      expect(parseRooms(3)).toBe(3);
      expect(parseRooms('4')).toBe(4);
    });

    it('parses rooms from text', () => {
      expect(parseRooms('2 pokoje')).toBe(2);
      expect(parseRooms('5 pokoi')).toBe(5);
      expect(parseRooms('kawalerka')).toBe(1);
    });

    it('returns null for invalid inputs', () => {
      expect(parseRooms(null)).toBeNull();
      expect(parseRooms('')).toBeNull();
    });
  });

  describe('parseFloor', () => {
    it('handles numeric floor', () => {
      expect(parseFloor(6)).toEqual({ floor: 6, totalFloors: null });
    });

    it('handles string with total floors', () => {
      expect(parseFloor('6/7')).toEqual({ floor: 6, totalFloors: 7 });
      expect(parseFloor('parter/4')).toEqual({ floor: 0, totalFloors: 4 });
    });

    it('handles parter and simple string floor', () => {
      expect(parseFloor('parter')).toEqual({ floor: 0, totalFloors: null });
      expect(parseFloor('3')).toEqual({ floor: 3, totalFloors: null });
    });

    it('returns nulls for invalid inputs', () => {
      expect(parseFloor(null)).toEqual({ floor: null, totalFloors: null });
      expect(parseFloor('')).toEqual({ floor: null, totalFloors: null });
    });
  });

  describe('parseExternalId', () => {
    it('extracts ID from Morizon URL', () => {
      const url = 'https://www.morizon.pl/oferta/sprzedaz-mieszkanie-warszawa-praga-polnoc-wilenska-42m2-mzn2046721837';
      expect(parseExternalId(url)).toBe('mzn2046721837');
    });

    it('extracts ID from relative or raw ID string', () => {
      expect(parseExternalId('/oferta/wynajem-mieszkanie-warszawa-morizon12345')).toBe('morizon12345');
      expect(parseExternalId('mzn2046721837')).toBe('mzn2046721837');
    });

    it('returns null for invalid inputs', () => {
      expect(parseExternalId(null)).toBeNull();
      expect(parseExternalId('')).toBeNull();
    });
  });

  describe('parseSellerType', () => {
    it('identifies agency or company from Organization object', () => {
      expect(parseSellerType({ '@type': 'Organization', name: 'HOMEMADE NIERUCHOMOŚCI' })).toBe('agency');
      expect(parseSellerType({ '@type': 'Organization', name: 'Deweloper SA' })).toBe('developer');
    });

    it('identifies private seller', () => {
      expect(parseSellerType({ '@type': 'Person', name: 'Jan Kowalski' })).toBe('private');
      expect(parseSellerType('Osoba prywatna')).toBe('private');
    });

    it('identifies from string keywords', () => {
      expect(parseSellerType('Biuro Nieruchomości ABC')).toBe('agency');
      expect(parseSellerType('Firma Handlowa')).toBe('company');
    });
  });
});
