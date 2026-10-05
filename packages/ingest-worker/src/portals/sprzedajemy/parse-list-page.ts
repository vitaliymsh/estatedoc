import * as cheerio from 'cheerio';
import type { StandardListing } from './types.js';
import { parsePrice, parseArea, parseRooms, parseOfferId, parseSellerType } from './parsers.js';
import {
  calculatePricePerSqm,
  parseTransactionType,
  parsePropertyType,
  sanitizeTitle,
} from './normalizers.js';

const BASE_URL = 'https://sprzedajemy.pl';

export function parseListPage(html: string): StandardListing[] {
  if (!html) return [];
  const $ = cheerio.load(html);
  const listings: StandardListing[] = [];

  $('li[id^="offer-"]').each((_, el) => {
    const $item = $(el);
    const idAttr = $item.attr('id') || '';
    const externalId = parseOfferId(idAttr);
    if (!externalId) return;

    const titleAnchor = $item.find('h2.title a.offerLink');
    const title = titleAnchor.text().trim();
    if (!title) return;

    const href = titleAnchor.attr('href') || '';
    const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    const priceText = $item.find('span.price').text().trim();
    const price = parsePrice(priceText);

    let areaSqm: number | null = null;
    let roomsCount: number | null = null;
    const metadata: Record<string, unknown> = {};

    $item.find('p.attributes span.attribute').each((__, attrEl) => {
      const text = $(attrEl).text().trim();
      if (text.includes('Pow.')) {
        areaSqm = parseArea(text);
      } else if (text.includes('Pokoje:')) {
        roomsCount = parseRooms(text);
      } else if (text.includes('Działka:')) {
        metadata.plotSqm = parseArea(text);
      } else if (text.includes('Zabudowa:')) {
        metadata.buildingType = text.replace('Zabudowa:', '').trim();
      }
    });

    const city = $item.find('strong.city').text().trim();
    const districtText = $item.find('span.precinct').text().trim();
    const district = districtText || undefined;

    const sellerTypeClass = $item.find('.seller-type-info').attr('class') || '';
    const sellerType = parseSellerType(sellerTypeClass);

    const locationHref = $item.find('a.location').attr('href') || '';
    const transactionType = parseTransactionType(`${locationHref} ${title}`);
    const propertyType = parsePropertyType(`${locationHref} ${title}`);
    const pricePerSqm = calculatePricePerSqm(price, areaSqm);

    const imageUrl = $item.find('span.listImgWrp img').attr('src');
    const images = imageUrl ? [imageUrl] : [];
    const postedAt = $item.find('time.time').attr('datetime') || undefined;

    listings.push({
      portal: 'sprzedajemy',
      externalId,
      url,
      title: sanitizeTitle(title),
      price,
      pricePerSqm,
      areaSqm,
      roomsCount,
      floor: null,
      totalFloors: null,
      transactionType,
      propertyType,
      city,
      district,
      sellerType,
      description: null,
      images,
      postedAt,
      metadata,
    });
  });

  return listings;
}
