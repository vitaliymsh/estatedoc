import * as cheerio from 'cheerio';
import type { StandardListing, MorizonJsonLdProduct, MorizonJsonLdBreadcrumbList } from './types.js';
import { parsePrice, parseArea, parseRooms, parseFloor, parseExternalId } from './parsers.js';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  extractCityAndDistrict,
  cleanDescriptionHtml,
} from './normalizers.js';
import { sanitizeTitle } from '../../utils/sanitizers.js';
import { extractJsonLd } from '../../utils/parsers.js';

const BASE_URL = 'https://www.morizon.pl';

export function parseListPage(html: string): StandardListing[] {
  if (!html) return [];

  // 1. Try Schema.org JSON-LD extraction
  const jsonLdItems = extractJsonLd<Record<string, any>>(html);
  let productJsonLd: MorizonJsonLdProduct | null = null;
  const breadcrumbNames: string[] = [];

  for (const item of jsonLdItems) {
    if (item['@type'] === 'BreadcrumbList' && Array.isArray(item.itemListElement)) {
      for (const el of item.itemListElement) {
        if (el.name) breadcrumbNames.push(el.name);
      }
    } else if (
      (item['@type'] === 'Product' || item['@type'] === 'RealEstateListing' || item.offers?.offers) &&
      !productJsonLd
    ) {
      productJsonLd = item as MorizonJsonLdProduct;
    }
  }


  if (productJsonLd?.offers?.offers && Array.isArray(productJsonLd.offers.offers)) {
    const listings: StandardListing[] = [];
    for (const offer of productJsonLd.offers.offers) {
      if (!offer.url) continue;
      const externalId = parseExternalId(offer.url);
      if (!externalId) continue;

      const title = offer.name || '';
      const price = parsePrice(offer.price);
      const areaSqm = parseArea(offer.itemOffered?.floorSize?.value) || parseArea(title);
      const roomsCount = parseRooms(offer.itemOffered?.numberOfRooms) || parseRooms(title);

      const floorLevel = offer.itemOffered?.floorLevel;
      const parsedFloor = parseFloor(floorLevel);
      const floor = parsedFloor.floor;
      const totalFloors = parsedFloor.totalFloors;

      const fullUrl = offer.url.startsWith('http') ? offer.url : `${BASE_URL}${offer.url}`;
      const transactionType = parseTransactionType(`${fullUrl} ${title}`);
      const propertyType = parsePropertyType(`${fullUrl} ${title}`);
      const pricePerSqm = calculatePricePerSqm(price, areaSqm);

      const location = extractCityAndDistrict(offer.itemOffered?.address, breadcrumbNames, title);
      const images: string[] = Array.isArray(offer.image)
        ? offer.image
        : offer.image
          ? [offer.image]
          : [];
      const description = cleanDescriptionHtml(offer.itemOffered?.description);

      listings.push({
        portal: 'morizon',
        externalId,
        url: fullUrl,
        title: sanitizeTitle(title),
        price,
        pricePerSqm,
        areaSqm,
        roomsCount,
        floor,
        totalFloors,
        transactionType,
        propertyType,
        city: location.city,
        district: location.district,
        street: location.street,
        sellerType: undefined,
        description,
        images,
        metadata: undefined,
      });
    }

    if (listings.length > 0) {
      return listings;
    }
  }

  // 2. DOM fallback
  const $ = cheerio.load(html);
  const domListings: StandardListing[] = [];
  const seenIds = new Set<string>();

  $('a[href*="/oferta/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const externalId = parseExternalId(href);
    if (!externalId || seenIds.has(externalId)) return;
    seenIds.add(externalId);

    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    const cardEl = $(el).closest('article, div, li') || $(el);
    const rawTitle = $(el).find('h2, h3').text().trim() || $(el).attr('title') || $(el).text().trim();
    if (!rawTitle) return;

    const priceText = cardEl.find('.price, [class*="price"]').first().text().trim();
    const price = parsePrice(priceText);
    const areaSqm = parseArea(rawTitle);
    const roomsCount = parseRooms(rawTitle);
    const transactionType = parseTransactionType(`${fullUrl} ${rawTitle}`);
    const propertyType = parsePropertyType(`${fullUrl} ${rawTitle}`);
    const pricePerSqm = calculatePricePerSqm(price, areaSqm);

    const imgUrl = cardEl.find('img').attr('src') || cardEl.find('img').attr('data-src');
    const images = imgUrl ? [imgUrl] : [];

    domListings.push({
      portal: 'morizon',
      externalId,
      url: fullUrl,
      title: sanitizeTitle(rawTitle),
      price,
      pricePerSqm,
      areaSqm,
      roomsCount,
      floor: null,
      totalFloors: null,
      transactionType,
      propertyType,
      city: 'Polska',
      images,
      description: null,
    });
  });

  return domListings;
}
