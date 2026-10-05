import * as cheerio from 'cheerio';
import type { StandardListing } from '../../types.js';
import type { GratkaJsonLdProduct, GratkaJsonLdBreadcrumb } from './types.js';
import {
  parseExternalId,
  parsePrice,
  parseArea,
  parseRooms,
  parseFloor,
  buildOfferUrl,
  extractImageUrls,
} from './parsers.js';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  extractLocation,
  cleanDescriptionHtml,
} from './normalizers.js';
import { extractJsonLd } from '../../utils/parsers.js';

export function parseListPage(html: string): StandardListing[] {
  if (!html) return [];

  // 1. JSON-LD extraction
  const jsonLdItems = extractJsonLd<Record<string, any>>(html);
  let productJsonLd: GratkaJsonLdProduct | null = null;
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
      productJsonLd = item as GratkaJsonLdProduct;
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

      const parsedFloor = parseFloor(offer.itemOffered?.floorLevel);
      const fullUrl = buildOfferUrl(offer.url);
      const transactionType = parseTransactionType(`${fullUrl} ${title}`);
      const propertyType = parsePropertyType(`${fullUrl} ${title}`);
      const pricePerSqm = calculatePricePerSqm(price, areaSqm);

      const location = extractLocation(breadcrumbNames, offer.itemOffered?.address, title);
      const images = extractImageUrls(offer.image);
      const description = cleanDescriptionHtml(offer.description);

      listings.push({
        portal: 'gratka',
        externalId,
        url: fullUrl,
        title,
        price,
        pricePerSqm,
        areaSqm,
        roomsCount,
        floor: parsedFloor.floor,
        totalFloors: parsedFloor.totalFloors,
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

  $('a[href*="/ob/"], article.teaser, article[data-cy="teaser"]').each((_, el) => {
    const cardEl = $(el).is('article') ? $(el) : $(el).closest('article');
    const linkEl = cardEl.find('a[href*="/ob/"]').first().length ? cardEl.find('a[href*="/ob/"]').first() : $(el);
    const href = linkEl.attr('href') || '';
    const externalId = parseExternalId(href);
    if (!externalId || seenIds.has(externalId)) return;
    seenIds.add(externalId);

    const fullUrl = buildOfferUrl(href);
    const title =
      cardEl.find('.teaser__title, h2, h3').text().trim() ||
      linkEl.attr('title') ||
      linkEl.text().trim();
    if (!title) return;

    const priceText = cardEl.find('.teaser__price, [class*="price"]').text().trim();
    const price = parsePrice(priceText);
    const paramsText = cardEl.find('.teaser__params, ul, p').text().trim();
    const areaSqm = parseArea(paramsText) || parseArea(title);
    const roomsCount = parseRooms(paramsText) || parseRooms(title);

    const floorParsed = parseFloor(paramsText);
    const transactionType = parseTransactionType(`${fullUrl} ${title}`);
    const propertyType = parsePropertyType(`${fullUrl} ${title}`);
    const pricePerSqm = calculatePricePerSqm(price, areaSqm);
    const location = extractLocation([], undefined, title);

    const imgSrc =
      cardEl.find('img.teaser__image, img').attr('src') ||
      cardEl.find('img').attr('data-src');
    const images = extractImageUrls(imgSrc);

    domListings.push({
      portal: 'gratka',
      externalId,
      url: fullUrl,
      title,
      price,
      pricePerSqm,
      areaSqm,
      roomsCount,
      floor: floorParsed.floor,
      totalFloors: floorParsed.totalFloors,
      transactionType,
      propertyType,
      city: location.city,
      district: location.district,
      street: location.street,
      description: null,
      images,
      metadata: undefined,
    });
  });

  return domListings;
}
