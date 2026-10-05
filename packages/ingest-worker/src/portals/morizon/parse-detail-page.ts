import * as cheerio from 'cheerio';
import type { StandardListing, MorizonJsonLdOffer } from './types.js';
import { parsePrice, parseFloor, parseSellerType } from './parsers.js';
import { extractCityAndDistrict, cleanDescriptionHtml } from './normalizers.js';

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
  const imagesSet = new Set<string>();

  if (offerJsonLd) {
    const offer: MorizonJsonLdOffer = offerJsonLd;
    if (offer.description) {
      description = cleanDescriptionHtml(offer.description);
    }
    if (offer.price !== undefined) {
      price = parsePrice(offer.price);
    }
    if (offer.image) {
      imagesSet.add(offer.image);
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
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && (src.includes('staticmorizon') || src.includes('cdngr')) && !src.includes('logo') && !src.includes('avatar')) {
      imagesSet.add(src);
    }
  });

  const location = extractCityAndDistrict(undefined, breadcrumbNames);

  return {
    description,
    price: price ?? undefined,
    images: Array.from(imagesSet),
    floor,
    totalFloors,
    sellerType,
    city: location.city !== 'Polska' ? location.city : undefined,
    district: location.district,
    metadata,
  };
}
