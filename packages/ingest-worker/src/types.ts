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
