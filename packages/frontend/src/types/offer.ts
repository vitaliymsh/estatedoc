export interface OfferMetadata {
  postedAt?: string
  plotSqm?: number
  buildingType?: string
  marketType?: string
  yearBuilt?: number
  condition?: string
  heating?: string
  ownership?: string
  agencyName?: string
  agencyPhone?: string
  imageUrl?: string
  [key: string]: unknown
}

export interface Offer {
  id: number
  portal: string
  externalId: string
  url: string
  title: string
  price: string | null
  areaSqm: string | null
  roomsCount: number | null
  floor?: number | null
  totalFloors?: number | null
  propertyType?: 'apartment' | 'house' | 'land' | 'commercial' | 'garage' | 'other' | null
  transactionType?: 'sale' | 'rent' | null
  city: string
  district?: string | null
  street?: string | null
  sellerType?: 'company' | 'private' | 'agency' | 'developer' | 'verified' | string | null
  images?: string[] | null
  description: string | null
  metadata: OfferMetadata | null
  createdAt: string
  updatedAt: string
}

export type SortBy = 'newest' | 'price_asc' | 'price_desc'

export interface ListOffersFilter {
  q?: string
  city?: string
  portal?: string
  minPrice?: number
  maxPrice?: number
  sortBy: SortBy
  page: number
}

export interface OffersResponse {
  items: Offer[]
  total: number
  limit: number
  offset: number
}
