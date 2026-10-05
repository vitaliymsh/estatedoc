import { describe, it, expect } from 'vitest';
import { cleanAndDeduplicateImages } from '../gallery.js';

describe('gallery utilities', () => {
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
        'https://img1.staticmorizon.com.pl/thumb/photo1.jpg',
        'https://img1.staticmorizon.com.pl/thumb/photo2.jpg',
      ]);
    });

    it('deduplicates identical URLs', () => {
      const urls = [
        'https://thumbs.img-sprzedajemy.pl/650x490_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/650x490_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/650x490_0/c5/49/89/photo2.jpg',
      ];

      const cleaned = cleanAndDeduplicateImages(urls, 'sprzedajemy');
      expect(cleaned).toHaveLength(2);
      expect(cleaned).toEqual([
        'https://thumbs.img-sprzedajemy.pl/650x490_0/b4/38/78/lokal-134m2.jpg',
        'https://thumbs.img-sprzedajemy.pl/650x490_0/c5/49/89/photo2.jpg',
      ]);
    });
  });
});
