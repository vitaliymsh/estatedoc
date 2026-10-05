import type { SprzedajemyListing } from './portals/sprzedajemy/types.js';

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

export function mapListingToBatchDto(listing: SprzedajemyListing): BatchOfferDto {
  const metadata: Record<string, unknown> = {
    ...(listing.metadata || {}),
  };

  if (listing.district) metadata.district = listing.district;
  if (listing.sellerType) metadata.sellerType = listing.sellerType;
  if (listing.imageUrl) metadata.imageUrl = listing.imageUrl;
  if (listing.postedAt) metadata.postedAt = listing.postedAt;

  return {
    portal: listing.portal,
    externalId: listing.externalId,
    url: listing.url,
    title: listing.title,
    price: listing.price ?? null,
    areaSqm: listing.areaSqm ?? null,
    roomsCount: listing.roomsCount ?? null,
    city: listing.city,
    description: null,
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
