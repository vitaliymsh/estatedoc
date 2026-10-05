export * from '../../types.js';

export interface MorizonJsonLdAddress {
  '@type'?: string;
  addressCountry?: string;
  addressLocality?: string;
  streetAddress?: string;
  addressRegion?: string;
  postalCode?: string;
}

export interface MorizonJsonLdItemOffered {
  '@type'?: string;
  address?: MorizonJsonLdAddress;
  description?: string;
  numberOfRooms?: number | string;
  floorLevel?: number | string;
  floorSize?: {
    '@type'?: string;
    value?: number | string;
    unitCode?: string;
  };
}

export interface MorizonJsonLdOffer {
  '@context'?: string;
  '@type'?: string;
  availability?: string;
  name?: string;
  price?: number | string;
  priceCurrency?: string;
  url?: string;
  image?: string;
  category?: string;
  description?: string;
  seller?: {
    '@type'?: string;
    name?: string;
    telephone?: string;
  };
  itemOffered?: MorizonJsonLdItemOffered;
}

export interface MorizonJsonLdProduct {
  '@context'?: string;
  '@type'?: string;
  additionalType?: string;
  name?: string;
  url?: string;
  offers?: {
    '@type'?: string;
    lowPrice?: string;
    highPrice?: string;
    offers?: MorizonJsonLdOffer[];
  };
}

export interface MorizonJsonLdBreadcrumbList {
  '@context'?: string;
  '@type'?: string;
  itemListElement?: Array<{
    '@type'?: string;
    position?: number;
    name?: string;
    item?: Array<{
      '@type'?: string;
      url?: string;
      name?: string;
      '@id'?: string;
    }>;
  }>;
}
