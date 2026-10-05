import type { StandardListing } from './portals/sprzedajemy/types.js';

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
  };

  if (listing.district) metadata.district = listing.district;
  if (listing.sellerType) metadata.sellerType = listing.sellerType;
  if (listing.images && listing.images.length > 0) {
    metadata.imageUrl = listing.images[0];
    metadata.images = listing.images;
  }
  if (listing.postedAt) metadata.postedAt = listing.postedAt;
  if (listing.floor !== null && listing.floor !== undefined) metadata.floor = listing.floor;
  if (listing.totalFloors !== null && listing.totalFloors !== undefined) metadata.totalFloors = listing.totalFloors;
  if (listing.propertyType) metadata.propertyType = listing.propertyType;
  if (listing.transactionType) metadata.transactionType = listing.transactionType;

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
