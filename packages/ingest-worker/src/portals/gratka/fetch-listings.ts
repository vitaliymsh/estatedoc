import { type StandardListing, DEFAULT_HEADERS } from '../../types.js';
import type { GratkaParsedDetailPage } from './types.js';
import { parseListPage } from './parse-list-page.js';
import { parseDetailPage } from './parse-detail-page.js';
import { checkExistingOfferIds } from '../../exporter.js';

const GRATKA_BASE_URL = 'https://gratka.pl';


export interface GratkaFetchOptions {
  categoryPath?: string;
  page?: number;
  fetchFn?: typeof fetch;
}

export interface GratkaFetchAllOptions {
  categoryPath?: string;
  maxPages?: number;
  limit?: number;
  delayMs?: number;
  enrichDetails?: boolean;
  backendUrl?: string;
  knownIds?: Set<string>;
  fetchFn?: typeof fetch;
}

export async function fetchListingsPage(options: GratkaFetchOptions = {}): Promise<StandardListing[]> {
  const { categoryPath = '/nieruchomosci/mieszkania/warszawa', page = 1, fetchFn = fetch } = options;
  const path = categoryPath.startsWith('/') ? categoryPath : `/${categoryPath}`;
  const queryString = page > 1 ? `?page=${page}` : '';
  const url = `${GRATKA_BASE_URL}${path}${queryString}`;

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
): Promise<GratkaParsedDetailPage> {
  const res = await fetchFn(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to fetch details for ${url}: HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseDetailPage(html);
}

export async function fetchAllListings(options: GratkaFetchAllOptions = {}): Promise<StandardListing[]> {
  const {
    categoryPath = '/nieruchomosci/mieszkania/warszawa',
    maxPages = 1,
    limit,
    delayMs = 1000,
    enrichDetails = true,
    backendUrl,
    knownIds: initialKnownIds,
    fetchFn = fetch,
  } = options;

  const allListings: StandardListing[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageListings = await fetchListingsPage({ categoryPath, page, fetchFn });
      if (pageListings.length === 0) break;

      for (const listing of pageListings) {
        if (!seenIds.has(listing.externalId)) {
          seenIds.add(listing.externalId);
          allListings.push(listing);
        }
        if (limit && allListings.length >= limit) break;
      }

      if (limit && allListings.length >= limit) break;
      if (page < maxPages && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (err) {
      console.error(`[Gratka] Failed fetching page ${page}:`, err);
      break;
    }
  }

  if (enrichDetails && allListings.length > 0) {
    let knownIds = initialKnownIds;
    if (!knownIds && backendUrl) {
      try {
        const ids = allListings.map((l) => l.externalId);
        knownIds = await checkExistingOfferIds('gratka', ids, backendUrl);
      } catch {
        knownIds = new Set<string>();
      }
    }

    for (let i = 0; i < allListings.length; i++) {
      const listing = allListings[i];
      if (knownIds && knownIds.has(listing.externalId)) {
        continue;
      }

      try {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const details = await fetchListingDetails(listing.url, fetchFn);
        allListings[i] = {
          ...listing,
          title: details.title || listing.title,
          price: details.price ?? listing.price,
          pricePerSqm: details.pricePerSqm ?? listing.pricePerSqm,
          areaSqm: details.areaSqm ?? listing.areaSqm,
          roomsCount: details.roomsCount ?? listing.roomsCount,
          floor: details.floor ?? listing.floor,
          totalFloors: details.totalFloors ?? listing.totalFloors,
          city: details.city || listing.city,
          district: details.district || listing.district,
          street: details.street || listing.street,
          sellerType: details.sellerType ?? listing.sellerType,
          description: details.description ?? listing.description,
          images: details.images.length > 0 ? details.images : listing.images,
          metadata: {
            ...listing.metadata,
            ...details.metadata,
          },
        };
      } catch (err) {
        console.error(`[Gratka] Failed to enrich listing ${listing.url}:`, err);
      }
    }
  }

  return allListings;
}
