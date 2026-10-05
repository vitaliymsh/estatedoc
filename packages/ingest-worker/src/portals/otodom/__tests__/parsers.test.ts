import { describe, it, expect } from 'vitest';
import {
  extractNextData,
  parseRoomsNumber,
  parseFloor,
  buildOfferUrl,
  extractImageUrls,
} from '../parsers.js';

describe('otodom parsers', () => {
  describe('extractNextData', () => {
    it('extracts and parses valid __NEXT_DATA__ JSON script tag', () => {
      const html = `
        <html>
          <head>
            <script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"lang":"pl"}}}</script>
          </head>
        </html>
      `;
      const result = extractNextData(html);
      expect(result).toEqual({ props: { pageProps: { lang: 'pl' } } });
    });

    it('returns null if __NEXT_DATA__ tag is missing', () => {
      const html = '<html><body><div>No data</div></body></html>';
      expect(extractNextData(html)).toBeNull();
    });

    it('returns null if JSON inside __NEXT_DATA__ is invalid', () => {
      const html = '<script id="__NEXT_DATA__" type="application/json">{invalid json}</script>';
      expect(extractNextData(html)).toBeNull();
    });
  });

  describe('parseRoomsNumber', () => {
    it('converts word representations to numbers', () => {
      expect(parseRoomsNumber('ONE')).toBe(1);
      expect(parseRoomsNumber('TWO')).toBe(2);
      expect(parseRoomsNumber('THREE')).toBe(3);
      expect(parseRoomsNumber('FOUR')).toBe(4);
      expect(parseRoomsNumber('FIVE')).toBe(5);
      expect(parseRoomsNumber('SIX')).toBe(6);
      expect(parseRoomsNumber('SEVEN')).toBe(7);
      expect(parseRoomsNumber('EIGHT')).toBe(8);
      expect(parseRoomsNumber('NINE')).toBe(9);
      expect(parseRoomsNumber('TEN')).toBe(10);
      expect(parseRoomsNumber('MORE')).toBe(11);
    });

    it('handles numeric strings and numbers', () => {
      expect(parseRoomsNumber('3')).toBe(3);
      expect(parseRoomsNumber(4)).toBe(4);
      expect(parseRoomsNumber('4 pokoje')).toBe(4);
    });

    it('returns null for empty/invalid values', () => {
      expect(parseRoomsNumber(null)).toBeNull();
      expect(parseRoomsNumber(undefined)).toBeNull();
      expect(parseRoomsNumber('')).toBeNull();
      expect(parseRoomsNumber('unknown')).toBeNull();
    });
  });

  describe('parseFloor', () => {
    it('parses floor enum strings', () => {
      expect(parseFloor('floor_1')).toBe(1);
      expect(parseFloor('floor_6')).toBe(6);
      expect(parseFloor('ground')).toBe(0);
      expect(parseFloor('parter')).toBe(0);
      expect(parseFloor('floor_10')).toBe(10);
    });

    it('parses raw numbers and numeric strings', () => {
      expect(parseFloor(2)).toBe(2);
      expect(parseFloor('3')).toBe(3);
      expect(parseFloor(0)).toBe(0);
    });

    it('returns null for unknown/null values', () => {
      expect(parseFloor(null)).toBeNull();
      expect(parseFloor(undefined)).toBeNull();
      expect(parseFloor('unknown')).toBeNull();
    });
  });

  describe('buildOfferUrl', () => {
    it('constructs absolute offer URL from plain slug', () => {
      expect(buildOfferUrl('mieszkanie-krakow-ID123')).toBe(
        'https://www.otodom.pl/pl/oferta/mieszkanie-krakow-ID123'
      );
    });

    it('strips leading [lang]/ad/ prefix if present', () => {
      expect(buildOfferUrl('[lang]/ad/mieszkanie-krakow-ID123')).toBe(
        'https://www.otodom.pl/pl/oferta/mieszkanie-krakow-ID123'
      );
    });
  });

  describe('extractImageUrls', () => {
    it('extracts highest resolution images and removes duplicates', () => {
      const images = [
        {
          thumbnail: 'https://img.cdn/thumb1.jpg',
          large: 'https://img.cdn/large1.jpg',
        },
        {
          medium: 'https://img.cdn/med2.jpg',
        },
        {
          large: 'https://img.cdn/large1.jpg', // duplicate
        },
      ];
      expect(extractImageUrls(images)).toEqual([
        'https://img.cdn/large1.jpg',
        'https://img.cdn/med2.jpg',
      ]);
    });

    it('returns empty array when images are empty or undefined', () => {
      expect(extractImageUrls(undefined)).toEqual([]);
      expect(extractImageUrls([])).toEqual([]);
    });
  });
});
