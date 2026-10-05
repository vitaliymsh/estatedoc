import type { StandardListing } from './types.js';
import { parseListPage } from './parse-list-page.js';
import { parseDetailPage } from './parse-detail-page.js';
import { checkExistingOfferIds } from '../../exporter.js';

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
  enrichDetails?: boolean;
  backendUrl?: string;
  knownIds?: Set<string>;
  fetchFn?: typeof fetch;
}

export async function fetchListingsPage(options: FetchOptions = {}): Promise<StandardListing[]> {
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

export async function fetchListingDetails(
  url: string,
  fetchFn: typeof fetch = fetch
): Promise<Partial<StandardListing>> {
  const res = await fetchFn(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch details for ${url}: HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseDetailPage(html);
}

export async function fetchAllListings(options: FetchAllOptions = {}): Promise<StandardListing[]> {
  const {
    categoryPath = '/nieruchomosci',
    maxPages = 5,
    delayMs = 1000,
    enrichDetails = false,
    backendUrl,
    knownIds,
    fetchFn = fetch,
  } = options;

  const allListings: StandardListing[] = [];
  const seenIds = new Set<string>();

  // ponytail: sequential page fetch with 1s delay, upgrade to concurrent queue if scraping entire portal
  for (let page = 0; page < maxPages; page++) {
    const offset = page * PAGE_SIZE;
    const listings = await fetchListingsPage({ categoryPath, offset, fetchFn });
    if (listings.length === 0) break;

    let pageKnownIds = knownIds;
    if (enrichDetails && !pageKnownIds && backendUrl) {
      const pageIds = listings.map((l) => l.externalId);
      pageKnownIds = await checkExistingOfferIds('sprzedajemy', pageIds, backendUrl, fetchFn);
    }

    let addedCount = 0;
    for (const listing of listings) {
      if (!seenIds.has(listing.externalId)) {
        seenIds.add(listing.externalId);

        if (enrichDetails && (!pageKnownIds || !pageKnownIds.has(listing.externalId))) {
          try {
            const details = await fetchListingDetails(listing.url, fetchFn);
            if (details.description) listing.description = details.description;
            if (details.images && details.images.length > 0) listing.images = details.images;
            if (details.floor !== undefined) listing.floor = details.floor;
            if (details.totalFloors !== undefined) listing.totalFloors = details.totalFloors;
            if (details.metadata) {
              listing.metadata = { ...listing.metadata, ...details.metadata };
            }
          } catch (err) {
            console.warn(`[Ingest] Could not enrich details for ${listing.url}:`, err);
          }
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        }

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
