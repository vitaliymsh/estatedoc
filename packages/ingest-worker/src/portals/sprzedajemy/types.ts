export interface SprzedajemyListing {
  portal: 'sprzedajemy';
  externalId: string;
  url: string;
  title: string;
  price: number | null;
  areaSqm: number | null;
  roomsCount: number | null;
  city: string;
  district?: string;
  sellerType?: 'company' | 'private' | 'verified';
  imageUrl?: string;
  postedAt?: string;
  metadata?: Record<string, unknown>;
}
