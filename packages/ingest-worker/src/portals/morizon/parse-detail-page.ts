import * as cheerio from 'cheerio';
import type { StandardListing, MorizonJsonLdOffer } from './types.js';
import { parsePrice, parseFloor, parseSellerType } from './parsers.js';
import { extractCityAndDistrict, cleanDescriptionHtml } from './normalizers.js';
import { cleanAndDeduplicateImages } from '../../utils/gallery.js';

export function parseDetailPage(html: string): Partial<StandardListing> {
  if (!html) {
    return { description: null, images: [], floor: null, totalFloors: null, metadata: {} };
  }

  const $ = cheerio.load(html);
  const metadata: Record<string, unknown> = {};
  const breadcrumbNames: string[] = [];
  let offerJsonLd: MorizonJsonLdOffer | null = null;

  // 1. Parse JSON-LD scripts
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    const raw = $(el).html();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed['@type'] === 'BreadcrumbList' && Array.isArray(parsed.itemListElement)) {
        for (const item of parsed.itemListElement) {
          if (item.name) breadcrumbNames.push(item.name);
        }
      } else if (parsed['@type'] === 'Offer' && !offerJsonLd) {
        offerJsonLd = parsed as MorizonJsonLdOffer;
      }
    } catch {
      // Ignore single script parse errors
    }
  }

  let description: string | null = null;
  let price: number | null = null;
  let floor: number | null = null;
  let totalFloors: number | null = null;
  let sellerType: StandardListing['sellerType'] = undefined;
  const rawImages: string[] = [];

  if (offerJsonLd) {
    const offer: MorizonJsonLdOffer = offerJsonLd;
    if (offer.description) {
      description = cleanDescriptionHtml(offer.description);
    }
    if (offer.price !== undefined) {
      price = parsePrice(offer.price);
    }
    if (Array.isArray(offer.image)) {
      rawImages.push(...offer.image);
    } else if (typeof offer.image === 'string') {
      rawImages.push(offer.image);
    }
    if (offer.seller) {
      sellerType = parseSellerType(offer.seller);
      if (offer.seller.name) metadata.agencyName = offer.seller.name;
      if (offer.seller.telephone) metadata.agencyPhone = offer.seller.telephone;
    }
    if (offer.category) {
      metadata.category = offer.category;
    }
  }

  // Fallback description from DOM if missing
  if (!description) {
    const descText = $('[class*="description"], [class*="desc"]').text().trim();
    description = cleanDescriptionHtml(descText);
  }

  // Extract floor / totalFloors from description if present
  if (description) {
    const floorMatch = description.match(/pi[eę]tro:\s*([0-9/]+|parter)/i);
    if (floorMatch) {
      const parsed = parseFloor(floorMatch[1]);
      floor = parsed.floor;
      totalFloors = parsed.totalFloors;
    }
  }

  // Extract gallery images
  $('img, a[data-fancybox], a.gallery__item, picture source').each((_, el) => {
    const src =
      $(el).attr('src') ||
      $(el).attr('data-src') ||
      $(el).attr('href') ||
      $(el).attr('srcset');
    if (src && (src.includes('staticmorizon') || src.includes('cdngr'))) {
      rawImages.push(src);
    }
  });

  // Extract DOM information tables
  $('.information-table__row, [data-cy="informationTableRow"]').each((_, el) => {
    const label = $(el).find('.information-table__cell--label, [data-cy="informationTableLabel"]').first().text().trim().toLowerCase();
    const val = $(el).find('.information-table__cell--value, [data-cy="informationTableValue"]').first().text().trim();
    if (!label || !val) return;

    if (label.includes('typ budynku')) {
      const lower = val.toLowerCase();
      if (lower.includes('kamienic')) metadata.buildingType = 'kamienica';
      else if (lower.includes('blok')) metadata.buildingType = 'blok';
      else if (lower.includes('apartament')) metadata.buildingType = 'apartamentowiec';
      else if (lower.includes('dom')) metadata.buildingType = 'dom';
      else metadata.buildingType = val;
    } else if (label.includes('materiał')) {
      metadata.buildingMaterial = val.toLowerCase();
    } else if (label.includes('rok budowy')) {
      const year = parseInt(val, 10);
      if (!isNaN(year)) metadata.yearBuilt = year;
    } else if (label.includes('rynek')) {
      metadata.marketType = val.toLowerCase().includes('pierwotn') ? 'primary' : 'secondary';
    } else if (label.includes('ogrzewanie')) {
      metadata.heating = val.toLowerCase();
    } else if (label.includes('forma własności')) {
      metadata.ownership = val.toLowerCase();
    } else if (label.includes('czynsz')) {
      const cleanRent = val.replace(/\s+/g, '').match(/\d+/);
      if (cleanRent) metadata.rentExtra = parseInt(cleanRent[0], 10);
    } else if (label.includes('umowy') && val.toLowerCase().includes('wyłączność')) {
      metadata.exclusiveOffer = true;
    } else if (label.includes('piętro') && floor === null) {
      const parsed = parseFloor(val);
      floor = parsed.floor;
      if (parsed.totalFloors !== null) totalFloors = parsed.totalFloors;
    } else if (label.includes('liczba pięter') && totalFloors === null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) totalFloors = parsed;
    }
  });

  // Extract amenities
  $('.attribute-list__wrapper li, [data-cy="iconListTile"], .page-details__attribute-list li').each((_, el) => {
    const text = $(el).text().trim();
    if (!text) return;
    const lower = text.toLowerCase();
    if (lower.includes('winda')) metadata.hasElevator = true;
    if (lower.includes('postojow') || lower.includes('parking') || lower.includes('garaż')) metadata.hasParking = true;
    if (lower.includes('piwnica') || lower.includes('komórk')) metadata.hasBasement = true;
    if (lower.includes('balkon') || lower.includes('taras') || lower.includes('loggi')) metadata.hasBalcony = true;
    if (lower.includes('klimatyzacj')) metadata.hasAirConditioning = true;
    if (lower.includes('umeblowan')) metadata.isFurnished = true;
  });

  // Extract tags
  const tags: string[] = [];
  $('.tags__list li, .page-details__details-tags-wrapper li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !tags.includes(text)) tags.push(text);
  });
  if (tags.length > 0) metadata.tags = tags;

  // Extract environmental cards
  $('.environmental-cards div, .page-details__environmental-cards div').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('Jakość powietrza')) {
      metadata.airQuality = text.split(':')[1]?.trim() || text.replace('Jakość powietrza', '').trim();
    } else if (text.includes('Poziom hałasu')) {
      metadata.noiseLevel = text.split(':')[1]?.trim() || text.replace('Poziom hałasu', '').trim();
    }
  });

  const images = cleanAndDeduplicateImages(rawImages, 'morizon');
  const location = extractCityAndDistrict(undefined, breadcrumbNames);

  return {
    description,
    price: price ?? undefined,
    images,
    floor,
    totalFloors,
    sellerType,
    city: location.city !== 'Polska' ? location.city : undefined,
    district: location.district,
    street: location.street,
    metadata,
  };
}
