import type { StandardListing } from './types.js';

export interface BatchOfferDto {
  portal: string;
  externalId: string;
  url: string;
  title: string;
  price?: number | null;
  areaSqm?: number | null;
  roomsCount?: number | null;
  city: string;
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
    ...(listing.district && { district: listing.district }),
    ...(listing.sellerType && { sellerType: listing.sellerType }),
    ...(listing.images?.length ? { imageUrl: listing.images[0], images: listing.images } : {}),
    ...(listing.postedAt && { postedAt: listing.postedAt }),
    ...(listing.floor !== null && listing.floor !== undefined && { floor: listing.floor }),
    ...(listing.totalFloors !== null && listing.totalFloors !== undefined && { totalFloors: listing.totalFloors }),
    ...(listing.propertyType && { propertyType: listing.propertyType }),
    ...(listing.transactionType && { transactionType: listing.transactionType }),
  };

  return {
    portal: listing.portal,
    externalId: listing.externalId,
    url: listing.url,
    title: listing.title,
    price: listing.price ?? null,
    areaSqm: listing.areaSqm ?? null,
    roomsCount: listing.roomsCount ?? null,
    city: listing.city,
    description: listing.description ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

export async function pushOffersBatch(
  dtos: BatchOfferDto[],
  backendUrl: string = process.env.BACKEND_URL || 'http://localhost:4000'
): Promise<PushBatchResult> {
  const url = `${backendUrl.replace(/\/$/, '')}/api/offers/batch`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dtos),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to push batch to backend (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<PushBatchResult>;
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
