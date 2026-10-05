import type { StandardListing } from './types.js';
import { parseListPage } from './parse-list-page.js';
import { parseDetailPage } from './parse-detail-page.js';
import { checkExistingOfferIds } from '../../exporter.js';

const BASE_URL = 'https://www.morizon.pl';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
};

export interface MorizonFetchOptions {
  categoryPath?: string;
  page?: number;
  fetchFn?: typeof fetch;
}

export interface MorizonFetchAllOptions {
  categoryPath?: string;
  maxPages?: number;
  limit?: number;
  delayMs?: number;
  enrichDetails?: boolean;
  backendUrl?: string;
  knownIds?: Set<string>;
  fetchFn?: typeof fetch;
}

export async function fetchListingsPage(options: MorizonFetchOptions = {}): Promise<StandardListing[]> {
  const { categoryPath = '/mieszkania/warszawa', page = 1, fetchFn = fetch } = options;
  const path = categoryPath.startsWith('/') ? categoryPath : `/${categoryPath}`;
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  const queryString = page > 1 ? `?page=${page}` : '';
  const url = `${BASE_URL}${normalizedPath}${queryString}`;

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

export async function fetchAllListings(options: MorizonFetchAllOptions = {}): Promise<StandardListing[]> {
  const {
    categoryPath = '/mieszkania/warszawa',
    maxPages = 5,
    limit,
    delayMs = 1000,
    enrichDetails = false,
    backendUrl,
    knownIds,
    fetchFn = fetch,
  } = options;

  const allListings: StandardListing[] = [];
  const seenIds = new Set<string>();

  // ponytail: sequential page fetch with 1s delay, upgrade to worker queue if mass-scraping
  for (let page = 1; page <= maxPages; page++) {
    if (limit && allListings.length >= limit) break;
    const listings = await fetchListingsPage({ categoryPath, page, fetchFn });
    if (listings.length === 0) break;

    let pageKnownIds = knownIds;
    if (enrichDetails && !pageKnownIds && backendUrl) {
      const pageIds = listings.map((l) => l.externalId);
      pageKnownIds = await checkExistingOfferIds('morizon', pageIds, backendUrl, fetchFn);
    }

    let addedCount = 0;
    for (const listing of listings) {
      if (limit && allListings.length >= limit) break;
      if (!seenIds.has(listing.externalId)) {
        seenIds.add(listing.externalId);

        if (enrichDetails && (!pageKnownIds || !pageKnownIds.has(listing.externalId))) {
          try {
            const details = await fetchListingDetails(listing.url, fetchFn);
            if (details.description) listing.description = details.description;
            if (details.images && details.images.length > 0) {
              listing.images = Array.from(new Set([...listing.images, ...details.images]));
            }
            if (details.floor !== null && details.floor !== undefined) listing.floor = details.floor;
            if (details.totalFloors !== null && details.totalFloors !== undefined) {
              listing.totalFloors = details.totalFloors;
            }
            if (details.sellerType) listing.sellerType = details.sellerType;
            if (details.city) listing.city = details.city;
            if (details.district) listing.district = details.district;
            if (details.metadata) {
              listing.metadata = { ...listing.metadata, ...details.metadata };
            }
          } catch (err) {
            console.warn(`[Ingest-Morizon] Could not enrich details for ${listing.url}:`, err);
          }
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        }

        allListings.push(listing);
        addedCount++;
      }
    }

    if (addedCount === 0) break;
    if (page < maxPages && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allListings;
}
