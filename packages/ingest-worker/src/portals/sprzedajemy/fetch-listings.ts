import type { SprzedajemyListing } from './types.js';
import { parseListPage } from './parse-list-page.js';

const BASE_URL = 'https://sprzedajemy.pl';
const PAGE_SIZE = 30;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
};

export interface FetchOptions {
  categoryPath?: string;
  offset?: number;
  fetchFn?: typeof fetch;
}

export interface FetchAllOptions {
  categoryPath?: string;
  maxPages?: number;
  delayMs?: number;
  fetchFn?: typeof fetch;
}

export async function fetchListingsPage(options: FetchOptions = {}): Promise<SprzedajemyListing[]> {
  const { categoryPath = '/nieruchomosci', offset = 0, fetchFn = fetch } = options;
  const path = categoryPath.startsWith('/') ? categoryPath : `/${categoryPath}`;
  const url = `${BASE_URL}${path}?offset=${offset}`;

  const res = await fetchFn(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  return parseListPage(html);
}

export async function fetchAllListings(options: FetchAllOptions = {}): Promise<SprzedajemyListing[]> {
  const { categoryPath = '/nieruchomosci', maxPages = 5, delayMs = 1000, fetchFn = fetch } = options;
  const allListings: SprzedajemyListing[] = [];
  const seenIds = new Set<string>();

  // ponytail: sequential page fetch with 1s delay, upgrade to concurrent queue if scraping entire portal
  for (let page = 0; page < maxPages; page++) {
    const offset = page * PAGE_SIZE;
    const listings = await fetchListingsPage({ categoryPath, offset, fetchFn });
    if (listings.length === 0) break;

    let addedCount = 0;
    for (const listing of listings) {
      if (!seenIds.has(listing.externalId)) {
        seenIds.add(listing.externalId);
        allListings.push(listing);
        addedCount++;
      }
    }

    if (addedCount === 0) break;
    if (page < maxPages - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allListings;
}
