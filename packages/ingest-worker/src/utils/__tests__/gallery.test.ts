import { describe, it, expect } from 'vitest';
import { upgradeImageUrl, cleanAndDeduplicateImages } from '../gallery.js';

describe('gallery utilities', () => {
  describe('upgradeImageUrl', () => {
    it('upgrades morizon thumb to big', () => {
      const thumb = 'https://img1.staticmorizon.com.pl/thumb/abc12345.jpg';
      expect(upgradeImageUrl(thumb, 'morizon')).toBe('https://img1.staticmorizon.com.pl/big/abc12345.jpg');
    });

    it('upgrades morizon mini to big', () => {
      const mini = 'https://img.cdngr.pl/morizon/mini/abc.jpg';
      expect(upgradeImageUrl(mini, 'morizon')).toBe('https://img.cdngr.pl/morizon/big/abc.jpg');
    });

    it('upgrades sprzedajemy resolutions to 1024x768_0', () => {
      const thumb1 = 'https://thumbs.img-sprzedajemy.pl/thumb/350x250c/b4/38/78/lokal-134m2-warszawa-605845591.jpg';
      expect(upgradeImageUrl(thumb1, 'sprzedajemy')).toBe(
        'https://thumbs.img-sprzedajemy.pl/thumb/1024x768_0/b4/38/78/lokal-134m2-warszawa-605845591.jpg'
      );

      const thumb2 = 'https://thumbs.img-sprzedajemy.pl/thumb/650x490_0/b4/38/78/lokal-134m2-warszawa-605845591.jpg';
      expect(upgradeImageUrl(thumb2, 'sprzedajemy')).toBe(
        'https://thumbs.img-sprzedajemy.pl/thumb/1024x768_0/b4/38/78/lokal-134m2-warszawa-605845591.jpg'
      );
    });

    it('returns original url if already high res or non-matching', () => {
      const full = 'https://img1.staticmorizon.com.pl/big/abc12345.jpg';
      expect(upgradeImageUrl(full, 'morizon')).toBe(full);
    });
  });

  describe('cleanAndDeduplicateImages', () => {
    it('filters out logos, avatars, and tracking pixels', () => {
      const urls = [
        'https://img1.staticmorizon.com.pl/thumb/photo1.jpg',
        'https://img1.staticmorizon.com.pl/thumb/agency-logo.jpg',
        'https://thumbs.img-sprzedajemy.pl/thumb/90x68_0/sp.gif',
        'https://img1.staticmorizon.com.pl/thumb/agent-avatar.jpg',
        'https://img1.staticmorizon.com.pl/thumb/photo2.jpg',
      ];

      const cleaned = cleanAndDeduplicateImages(urls, 'morizon');
      expect(cleaned).toEqual([
        'https://img1.staticmorizon.com.pl/big/photo1.jpg',
        'https://img1.staticmorizon.com.pl/big/photo2.jpg',
      ]);
    });

    it('deduplicates identical images with different resolutions', () => {
      const urls = [
        'https://thumbs.img-sprzedajemy.pl/thumb/350x250c/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/thumb/650x490_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/thumb/1024x768_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/thumb/650x490_0/c5/49/89/photo2.jpg',
      ];

      const cleaned = cleanAndDeduplicateImages(urls, 'sprzedajemy');
      expect(cleaned).toHaveLength(2);
      expect(cleaned).toEqual([
        'https://thumbs.img-sprzedajemy.pl/thumb/1024x768_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/thumb/1024x768_0/c5/49/89/photo2.jpg',
      ]);
    });
  });
});
