import { describe, it, expect } from 'vitest';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  parseFloor,
} from '../normalizers.js';

describe('normalizers', () => {
  describe('calculatePricePerSqm', () => {
    it('computes rounded price per square meter', () => {
      expect(calculatePricePerSqm(500000, 50)).toBe(10000);
      expect(calculatePricePerSqm(525000, 63.4)).toBe(8281);
    });

    it('returns null if price or area missing or zero', () => {
      expect(calculatePricePerSqm(null, 50)).toBeNull();
      expect(calculatePricePerSqm(500000, null)).toBeNull();
      expect(calculatePricePerSqm(500000, 0)).toBeNull();
    });
  });

  describe('parseTransactionType', () => {
    it('detects sale vs rent from url or text', () => {
      expect(parseTransactionType('/warszawa/nieruchomosci/mieszkania/sprzedaz')).toBe('sale');
      expect(parseTransactionType('/warszawa/nieruchomosci/mieszkania/wynajem')).toBe('rent');
      expect(parseTransactionType('https://sprzedajemy.pl/bez-prowizji-68-m-3-pokoje-balkon-1-miejsce-parkingowe-warszawa-wynajem')).toBe('rent');
      expect(parseTransactionType('Sprzedam mieszkanie 3 pok')).toBe('sale');
      expect(parseTransactionType('Wynajmę lokal biurowy')).toBe('rent');
      expect(parseTransactionType('/nieruchomosci')).toBeNull();
    });
  });

  describe('parsePropertyType', () => {
    it('maps url or keywords to standard PropertyType', () => {
      expect(parsePropertyType('/nieruchomosci/mieszkania')).toBe('apartment');
      expect(parsePropertyType('/nieruchomosci/domy')).toBe('house');
      expect(parsePropertyType('/nieruchomosci/grunty-i-dzialki')).toBe('land');
      expect(parsePropertyType('/nieruchomosci/lokale-uzytkowe')).toBe('commercial');
      expect(parsePropertyType('/nieruchomosci/garaze-i-miejsca-postojowe')).toBe('garage');
      expect(parsePropertyType('Mieszkanie 2 pokojowe')).toBe('apartment');
      expect(parsePropertyType('Działka budowlana')).toBe('land');
      expect(parsePropertyType('random string')).toBe('other');
    });
  });

  describe('parseFloor', () => {
    it('parses floor and total floors', () => {
      expect(parseFloor('3/4')).toEqual({ floor: 3, totalFloors: 4 });
      expect(parseFloor('3 / 10')).toEqual({ floor: 3, totalFloors: 10 });
      expect(parseFloor('parter')).toEqual({ floor: 0, totalFloors: null });
      expect(parseFloor('parter/4')).toEqual({ floor: 0, totalFloors: 4 });
      expect(parseFloor('4')).toEqual({ floor: 4, totalFloors: null });
    });

    it('returns nulls for invalid floor', () => {
      expect(parseFloor('')).toEqual({ floor: null, totalFloors: null });
    });
  });
});
