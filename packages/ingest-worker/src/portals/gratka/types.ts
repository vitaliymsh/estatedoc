import type { StandardListing, StandardListingMetadata, SellerType } from '../../types.js';

export interface GratkaJsonLdBreadcrumb {
  '@type': string;
  itemListElement?: Array<{
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface GratkaJsonLdOffer {
  '@type'?: string;
  name?: string;
  description?: string;
  url?: string;
  price?: number | string;
  priceCurrency?: string;
  image?: string | string[];
  itemOffered?: {
    '@type'?: string;
    name?: string;
    description?: string;
    floorSize?: {
      value?: number | string;
      unitCode?: string;
    };
    numberOfRooms?: number | string;
    floorLevel?: number | string;
    address?: {
      addressLocality?: string;
      streetAddress?: string;
      addressRegion?: string;
    };
  };
}

export interface GratkaJsonLdProduct {
  '@type'?: string;
  name?: string;
  offers?: {
    offers?: GratkaJsonLdOffer[];
  };
}

export interface GratkaParsedDetailPage {
  title?: string;
  price?: number | null;
  pricePerSqm?: number | null;
  areaSqm?: number | null;
  roomsCount?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  city?: string;
  district?: string;
  street?: string;
  sellerType?: SellerType;
  description?: string | null;
  images: string[];
  metadata: StandardListingMetadata;
}
