export type TransactionType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'garage' | 'other';
export type SellerType = 'private' | 'company' | 'agency' | 'developer' | 'verified';

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
  metadata?: Record<string, unknown>;
}
