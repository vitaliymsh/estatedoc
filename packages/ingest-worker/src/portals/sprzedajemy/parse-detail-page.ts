import * as cheerio from 'cheerio';
import type { StandardListing } from './types.js';
import { parseFloor } from './normalizers.js';
import { cleanAndDeduplicateImages } from '../../utils/gallery.js';

export function parseDetailPage(html: string): Partial<StandardListing> {
  if (!html) {
    return { description: null, images: [], floor: null, totalFloors: null, metadata: {} };
  }

  const $ = cheerio.load(html);
  const metadata: Record<string, unknown> = {};

  const descEl = $('.offerDescription');
  const description = descEl.length > 0 ? descEl.text().trim().replace(/\s+/g, ' ') : null;

  let floor: number | null = null;
  let totalFloors: number | null = null;

  $('.attributes-box .attribute-list li.item').each((_, el) => {
    const key = $(el).find('span').text().trim().toLowerCase();
    const val = $(el).find('strong').text().trim();
    if (!key || !val) return;

    if (key.includes('piętro')) {
      const parsed = parseFloor(val);
      floor = parsed.floor;
      totalFloors = parsed.totalFloors;
    } else if (key.includes('rynek')) {
      metadata.marketType = val;
    } else if (key.includes('rok budowy')) {
      const year = parseInt(val, 10);
      if (!isNaN(year)) metadata.yearBuilt = year;
    } else if (key.includes('stan')) {
      metadata.condition = val;
    } else if (key.includes('ogrzewanie')) {
      metadata.heating = val;
    } else if (key.includes('forma własności')) {
      metadata.ownership = val;
    }
  });

  const rawImages: string[] = [];
  $('img, a.element, a[data-original], .gallery-thumbs a, .gallery-slider a').each((_, el) => {
    const src =
      $(el).attr('data-original') ||
      $(el).attr('data-src') ||
      $(el).attr('href') ||
      $(el).attr('src');
    if (src && src.includes('img-sprzedajemy.pl')) {
      rawImages.push(src);
    }
  });

  const images = cleanAndDeduplicateImages(rawImages, 'sprzedajemy');

  return {
    description,
    images,
    floor,
    totalFloors,
    metadata,
  };
}
