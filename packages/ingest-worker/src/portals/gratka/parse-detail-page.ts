import * as cheerio from 'cheerio';
import type { GratkaParsedDetailPage } from './types.js';
import type { StandardListingMetadata, SellerType } from '../../types.js';
import {
  parsePrice,
  parseArea,
  parseRooms,
  parseFloor,
  extractImageUrls,
} from './parsers.js';
import {
  calculatePricePerSqm,
  parseSellerType,
  extractLocation,
  extractFeatures,
  cleanDescriptionHtml,
} from './normalizers.js';
import { extractJsonLd } from '../../utils/parsers.js';

export function parseDetailPage(html: string): GratkaParsedDetailPage {
  const metadata: StandardListingMetadata = {};
  if (!html) {
    return { images: [], metadata };
  }

  const $ = cheerio.load(html);

  // 1. JSON-LD Breadcrumbs and Offer
  const breadcrumbNames: string[] = [];
  let jsonLdTitle: string | undefined;
  let jsonLdPrice: number | null = null;
  let jsonLdSeller: SellerType | undefined;

  for (const parsed of extractJsonLd<Record<string, any>>(html)) {
    if (parsed['@type'] === 'BreadcrumbList' && Array.isArray(parsed.itemListElement)) {
      for (const item of parsed.itemListElement) {
        if (item.name) breadcrumbNames.push(item.name);
      }
    } else if (parsed['@type'] === 'Product' || parsed['@type'] === 'Offer') {
      const offer = parsed.offers || parsed;
      if (offer.name || parsed.name) {
        jsonLdTitle = offer.name || parsed.name;
      }
      if (offer.price) {
        jsonLdPrice = parsePrice(offer.price);
      }
      if (offer.seller) {
        jsonLdSeller = parseSellerType(offer.seller);
        if (offer.seller.name) metadata.agencyName = offer.seller.name;
        if (offer.seller.telephone) metadata.agencyPhone = offer.seller.telephone;
      }
    }
  }


  // 2. DOM extraction
  const title =
    $('h1.sticker__title, h1').first().text().trim() ||
    jsonLdTitle;

  const priceText = $('.priceInfo__value, [itemprop="price"], [class*="price"]').first().text().trim();
  const price = parsePrice(priceText) || jsonLdPrice;

  // Extract key-value parameters from lists (e.g. .parameters__single li)
  const paramMap = new Map<string, string>();
  $('ul.parameters__single li, .parameters li, [class*="parameter"] li').each((_, el) => {
    const label = $(el).find('span').text().trim().toLowerCase();
    const val = $(el).find('b, strong, span:last-child').text().trim();
    if (label && val) {
      paramMap.set(label, val);
    }
  });

  const areaText =
    paramMap.get('powierzchnia w m2') ||
    paramMap.get('powierzchnia') ||
    $('li:contains("Powierzchnia")').text();
  const areaSqm = parseArea(areaText) || parseArea(title);

  const roomsText =
    paramMap.get('liczba pokoi') ||
    paramMap.get('pokoje') ||
    $('li:contains("Liczba pokoi")').text();
  const roomsCount = parseRooms(roomsText) || parseRooms(title);

  const floorText =
    paramMap.get('piętro') ||
    $('li:contains("Piętro")').text();
  const totalFloorsText = paramMap.get('liczba pięter w budynku') || paramMap.get('liczba pięter');
  const parsedFloor = parseFloor(floorText, totalFloorsText);

  const locationText =
    paramMap.get('lokalizacja') ||
    paramMap.get('adres') ||
    $('.sticker__location, [class*="location"]').text();
  const location = extractLocation(breadcrumbNames, undefined, locationText || title);

  const yearBuiltText = paramMap.get('rok budowy');
  if (yearBuiltText) {
    const y = parseInt(yearBuiltText, 10);
    if (!isNaN(y)) metadata.yearBuilt = y;
  }

  const buildingTypeText = paramMap.get('typ zabudowy') || paramMap.get('rodzaj zabudowy');
  if (buildingTypeText) {
    metadata.buildingType = buildingTypeText.toLowerCase();
  }

  const materialText = paramMap.get('materiał budynku');
  if (materialText) {
    metadata.buildingMaterial = materialText.toLowerCase();
  }

  const conditionText = paramMap.get('stan wykończenia');
  if (conditionText) {
    metadata.condition = conditionText.toLowerCase();
  }

  const heatingText = paramMap.get('ogrzewanie');
  if (heatingText) {
    metadata.heating = heatingText.toLowerCase();
  }

  const marketText = paramMap.get('rynek');
  if (marketText) {
    metadata.marketType = /wtórny|wtorny/i.test(marketText) ? 'secondary' : /pierwotny/i.test(marketText) ? 'primary' : marketText.toLowerCase();
  }

  const rentExtraText = paramMap.get('czynsz') || paramMap.get('opłaty');
  if (rentExtraText) {
    const rent = parsePrice(rentExtraText);
    if (rent) metadata.rentExtra = rent;
  }

  const depositText = paramMap.get('kaucja');
  if (depositText) {
    const dep = parsePrice(depositText);
    if (dep) metadata.deposit = dep;
  }

  // Tags and Amenities
  const rawTags: string[] = [];
  const seenTags = new Set<string>();
  $('ul.tags li, .parameters__grouped li, a[class*="tag"], span[class*="tag"], li[class*="tag"]').each((_, el) => {
    if ($(el).children('a, span, li, div, p').length > 0) return;
    const t = $(el).text().trim();
    if (t && t.length < 50 && t.toUpperCase() !== 'REKLAMA' && !seenTags.has(t)) {
      seenTags.add(t);
      rawTags.push(t);
    }
  });

  const tags = rawTags.filter((tag) => {
    const isConcatenated = rawTags.some((other) => other !== tag && tag.includes(other) && tag.length > other.length * 1.5);
    return !isConcatenated;
  });

  if (tags.length > 0) {
    metadata.tags = tags;
  }

  const descriptionRaw =
    $('.description__rolled, .description, [class*="description"]').html() ||
    $('div[itemprop="description"]').html() ||
    null;
  const description = cleanDescriptionHtml(descriptionRaw);

  // Features
  const features = extractFeatures(tags, description || undefined);
  if (features.hasElevator !== undefined) metadata.hasElevator = features.hasElevator;
  if (features.hasBalcony !== undefined) metadata.hasBalcony = features.hasBalcony;
  if (features.hasParking !== undefined) metadata.hasParking = features.hasParking;
  if (features.hasBasement !== undefined) metadata.hasBasement = features.hasBasement;
  if (features.hasAirConditioning !== undefined) metadata.hasAirConditioning = features.hasAirConditioning;
  if (features.isFurnished !== undefined) metadata.isFurnished = features.isFurnished;

  // Images
  const images: string[] = [];
  $('.gallery img, [class*="gallery"] img, meta[property="og:image"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('content');
    if (src && src.startsWith('http') && !images.includes(src)) {
      images.push(src);
    }
  });

  const pricePerSqm = calculatePricePerSqm(price, areaSqm);

  const sellerTypeText = $('.seller__name, [class*="agency"], [class*="seller"]').text().trim();
  const sellerType = jsonLdSeller || parseSellerType(sellerTypeText);

  return {
    title,
    price,
    pricePerSqm,
    areaSqm,
    roomsCount,
    floor: parsedFloor.floor,
    totalFloors: parsedFloor.totalFloors,
    city: location.city,
    district: location.district,
    street: location.street,
    sellerType,
    description,
    images,
    metadata,
  };
}
