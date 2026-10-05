import type { StandardListing } from './types.js';

export interface BatchOfferDto {
  portal: string;
  externalId: string;
  url: string;
  title: string;
  price?: number | null;
  areaSqm?: number | null;
  roomsCount?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  propertyType?: string | null;
  transactionType?: string | null;
  city: string;
  district?: string | null;
  street?: string | null;
  sellerType?: string | null;
  images?: string[] | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PushBatchResult {
  inserted: number;
  updated: number;
}

export function mapListingToBatchDto(listing: StandardListing): BatchOfferDto {
  const metadata: Record<string, unknown> = {
    ...(listing.metadata || {}),
    ...(listing.postedAt && { postedAt: listing.postedAt }),
  };

  return {
    portal: listing.portal,
    externalId: listing.externalId,
    url: listing.url,
    title: listing.title,
    price: listing.price ?? null,
    areaSqm: listing.areaSqm ?? null,
    roomsCount: listing.roomsCount ?? null,
    floor: listing.floor ?? null,
    totalFloors: listing.totalFloors ?? null,
    propertyType: listing.propertyType ?? null,
    transactionType: listing.transactionType ?? null,
    city: listing.city,
    district: listing.district ?? null,
    street: listing.street ?? null,
    sellerType: listing.sellerType ?? null,
    images: listing.images?.length ? listing.images : null,
    description: listing.description ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

export async function pushOffersBatch(
  dtos: BatchOfferDto[],
  backendUrl: string = process.env.BACKEND_URL || 'http://localhost:4000',
  chunkSize: number = 50
): Promise<PushBatchResult> {
  if (dtos.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const url = `${backendUrl.replace(/\/$/, '')}/api/offers/batch`;
  let totalInserted = 0;
  let totalUpdated = 0;

  for (let i = 0; i < dtos.length; i += chunkSize) {
    const chunk = dtos.slice(i, i + chunkSize);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to push batch to backend (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as PushBatchResult;
    totalInserted += result.inserted;
    totalUpdated += result.updated;
  }

  return { inserted: totalInserted, updated: totalUpdated };
}

export async function checkExistingOfferIds(
  portal: string,
  externalIds: string[],
  backendUrl: string = process.env.BACKEND_URL || 'http://localhost:4000',
  fetchFn: typeof fetch = fetch
): Promise<Set<string>> {
  if (externalIds.length === 0) return new Set();
  const url = `${backendUrl.replace(/\/$/, '')}/api/offers/check-existing`;
  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal, externalIds }),
    });
    if (!response.ok) return new Set();
    const data = (await response.json()) as { existingIds: string[] };
    return new Set(data.existingIds);
  } catch {
    // ponytail: fallback to empty set if backend is down or unreachable
    return new Set();
  }
}
