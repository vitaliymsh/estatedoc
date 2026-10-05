import type { StandardListing } from '../../types.js';
import { parseOtodomListPage, type OtodomListPageResult } from './parse-list-page.js';
import { parseOtodomDetailPage } from './parse-detail-page.js';
import { checkExistingOfferIds } from '../../exporter.js';

const BASE_URL = 'https://www.otodom.pl';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
};

export interface OtodomFetchPageOptions {
  categoryPath?: string;
  page?: number;
  limit?: number;
  fetchFn?: typeof fetch;
}

export interface OtodomFetchAllOptions {
  categoryPath?: string;
  maxPages?: number;
  limit?: number;
  delayMs?: number;
  enrichDetails?: boolean;
  backendUrl?: string;
  knownIds?: Set<string>;
  fetchFn?: typeof fetch;
}

export async function fetchOtodomListPage(
  options: OtodomFetchPageOptions = {}
): Promise<OtodomListPageResult> {
  const {
    categoryPath = '/pl/wyniki/sprzedaz/mieszkanie/cala-polska',
    page = 1,
    limit = 36,
    fetchFn = fetch,
  } = options;

  const path = categoryPath.startsWith('/') ? categoryPath : `/${categoryPath}`;
  const url = `${BASE_URL}${path}?page=${page}&limit=${limit}`;

  const res = await fetchFn(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  return parseOtodomListPage(html);
}

export async function fetchOtodomDetails(
  baseListing: StandardListing,
  fetchFn: typeof fetch = fetch
): Promise<StandardListing> {
  const res = await fetchFn(baseListing.url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch details for ${baseListing.url}: HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseOtodomDetailPage(html, baseListing);
}

export async function fetchAllListings(
  options: OtodomFetchAllOptions = {}
): Promise<StandardListing[]> {
  const {
    categoryPath = '/pl/wyniki/sprzedaz/mieszkanie/cala-polska',
    maxPages = 3,
    limit,
    delayMs = 1000,
    enrichDetails = false,
    backendUrl,
    knownIds,
    fetchFn = fetch,
  } = options;

  const allListings: StandardListing[] = [];
  const seenIds = new Set<string>();

  // ponytail: sequential page fetch with 1-2s delay, avoids DataDome bot challenges
  for (let page = 1; page <= maxPages; page++) {
    if (limit && allListings.length >= limit) break;

    const pageResult = await fetchOtodomListPage({ categoryPath, page, limit: 36, fetchFn });
    const listings = pageResult.listings;
    if (listings.length === 0) break;

    let pageKnownIds = knownIds;
    if (enrichDetails && !pageKnownIds && backendUrl) {
      const pageIds = listings.map((l) => l.externalId);
      pageKnownIds = await checkExistingOfferIds('otodom', pageIds, backendUrl, fetchFn);
    }

    let addedCount = 0;
    for (let listing of listings) {
      if (limit && allListings.length >= limit) break;

      if (!seenIds.has(listing.externalId)) {
        seenIds.add(listing.externalId);

        if (enrichDetails && (!pageKnownIds || !pageKnownIds.has(listing.externalId))) {
          try {
            listing = await fetchOtodomDetails(listing, fetchFn);
          } catch (err) {
            console.warn(`[Ingest-Otodom] Could not enrich details for ${listing.url}:`, err);
          }
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        allListings.push(listing);
        addedCount++;
      }
    }

    if (addedCount === 0 || page >= pageResult.totalPages) break;
    if (page < maxPages && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return allListings;
}
