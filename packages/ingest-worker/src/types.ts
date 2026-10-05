export type TransactionType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'garage' | 'other';
export type SellerType = 'private' | 'company' | 'agency' | 'developer' | 'verified';

export interface StandardListingMetadata {
  buildingType?: string;
  buildingMaterial?: string;
  yearBuilt?: number;
  marketType?: string;
  condition?: string;
  heating?: string;
  ownership?: string;
  plotSqm?: number;
  rentExtra?: number;
  deposit?: number;
  availableFrom?: string;
  exclusiveOffer?: boolean;
  amenities?: string[];
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  hasTerrace?: boolean;
  hasParking?: boolean;
  hasBasement?: boolean;
  hasAirConditioning?: boolean;
  isFurnished?: boolean;
  isPetFriendly?: boolean;
  tags?: string[];
  airQuality?: string;
  noiseLevel?: string;
  agencyName?: string;
  agencyPhone?: string;
  postedAt?: string;
  updatedAt?: string;
  viewCount?: number;
  imageUrl?: string;
  pricePerSqm?: number;
  [key: string]: unknown;
}

export interface StandardListing {
  portal: string;
  externalId: string;
  url: string;
  title: string;
  price: number | null;
  pricePerSqm: number | null;
  areaSqm: number | null;
  roomsCount: number | null;
  floor: number | null;
  totalFloors: number | null;
  transactionType: TransactionType | null;
  propertyType: PropertyType;
  city: string;
  district?: string;
  street?: string;
  sellerType?: SellerType;
  description: string | null;
  images: string[];
  postedAt?: string;
  metadata?: StandardListingMetadata;
}

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
};

