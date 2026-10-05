import type { StandardListing } from './types.js';
import { DEFAULT_HEADERS } from '../../types.js';
import { parseListPage } from './parse-list-page.js';
import { parseDetailPage } from './parse-detail-page.js';
import { checkExistingOfferIds } from '../../exporter.js';

const BASE_URL = 'https://sprzedajemy.pl';
const PAGE_SIZE = 30;


export interface FetchOptions {
  categoryPath?: string;
  offset?: number;
  fetchFn?: typeof fetch;
}

export interface FetchAllOptions {
  categoryPath?: string;
  maxPages?: number;
  limit?: number;
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
    limit,
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
    if (limit && allListings.length >= limit) break;
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
      if (limit && allListings.length >= limit) break;
      if (!seenIds.has(listing.externalId)) {
        seenIds.add(listing.externalId);

        if (enrichDetails && (!pageKnownIds || !pageKnownIds.has(listing.externalId))) {
          try {
            const details = await fetchListingDetails(listing.url, fetchFn);
            if (details.description) listing.description = details.description;
            if (details.images && details.images.length > 0) listing.images = details.images;
            if (details.floor !== undefined) listing.floor = details.floor;
            if (details.totalFloors !== undefined) listing.totalFloors = details.totalFloors;
            if (details.district && !listing.district) listing.district = details.district;
            if (details.street && !listing.street) listing.street = details.street;
            if (details.transactionType) listing.transactionType = details.transactionType;
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
