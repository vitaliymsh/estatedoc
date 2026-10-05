import * as cheerio from 'cheerio';
import type { StandardListing } from './types.js';
import { parseFloor, sanitizeDescription } from './normalizers.js';
import { cleanAndDeduplicateImages } from '../../utils/gallery.js';

export function parseDetailPage(html: string): Partial<StandardListing> {
  if (!html) {
    return { description: null, images: [], floor: null, totalFloors: null, metadata: {} };
  }

  const $ = cheerio.load(html);
  const metadata: Record<string, unknown> = {};

  const descEl = $('.offerDescription');
  const description = descEl.length > 0 ? sanitizeDescription(descEl.text()) : null;

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
      metadata.marketType = val.toLowerCase().includes('pierwotn') ? 'primary' : 'secondary';
    } else if (key.includes('rok budowy')) {
      const year = parseInt(val, 10);
      if (!isNaN(year)) metadata.yearBuilt = year;
    } else if (key.includes('stan')) {
      metadata.condition = val;
    } else if (key.includes('ogrzewanie')) {
      const lower = val.toLowerCase();
      if (lower.includes('sieć') || lower.includes('miejsk')) metadata.heating = 'miejskie';
      else metadata.heating = lower;
    } else if (key.includes('forma własności')) {
      metadata.ownership = val.toLowerCase();
    } else if (key.includes('zabudowa')) {
      metadata.buildingType = val.toLowerCase();
    } else if (key.includes('materiał')) {
      metadata.buildingMaterial = val.toLowerCase();
    } else if (key.includes('czynsz')) {
      const cleanRent = val.replace(/\s+/g, '').match(/\d+/);
      if (cleanRent) metadata.rentExtra = parseInt(cleanRent[0], 10);
    } else if (key.includes('kaucja')) {
      const cleanDeposit = val.replace(/\s+/g, '').match(/\d+/);
      if (cleanDeposit) metadata.deposit = parseInt(cleanDeposit[0], 10);
    }
  });

  // Extract rent / deposit / amenities from description if not yet found
  if (description) {
    if (!metadata.rentExtra) {
      const rentMatch = description.match(/czynsz(?:\s+adm(?:inistracyjny)?\.?)?[:\s-]+([0-9\s]+)\s*z[łl]/i);
      if (rentMatch) {
        const num = parseInt(rentMatch[1].replace(/\s+/g, ''), 10);
        if (!isNaN(num)) metadata.rentExtra = num;
      }
    }
    if (!metadata.deposit) {
      const depMatch = description.match(/kaucj[ae][:\s-]+([0-9\s]+)\s*z[łl]/i);
      if (depMatch) {
        const num = parseInt(depMatch[1].replace(/\s+/g, ''), 10);
        if (!isNaN(num)) metadata.deposit = num;
      }
    }
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('winda')) metadata.hasElevator = true;
    if (lowerDesc.includes('balkon') || lowerDesc.includes('taras') || lowerDesc.includes('loggi')) metadata.hasBalcony = true;
    if (lowerDesc.includes('parking') || lowerDesc.includes('garaż') || lowerDesc.includes('postojow')) metadata.hasParking = true;
    if (lowerDesc.includes('piwnica') || lowerDesc.includes('komórk')) metadata.hasBasement = true;
    if (lowerDesc.includes('klimatyzacj')) metadata.hasAirConditioning = true;
    if (lowerDesc.includes('umeblowan')) metadata.isFurnished = true;
  }

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
