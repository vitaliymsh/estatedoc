export interface OfferMetadata {
  postedAt?: string
  plotSqm?: number
  buildingType?: string
  buildingMaterial?: string
  marketType?: string
  yearBuilt?: number
  condition?: string
  heating?: string
  ownership?: string
  rentExtra?: number
  deposit?: number
  exclusiveOffer?: boolean
  hasElevator?: boolean
  hasBalcony?: boolean
  hasParking?: boolean
  hasBasement?: boolean
  hasAirConditioning?: boolean
  isFurnished?: boolean
  tags?: string[]
  airQuality?: string
  noiseLevel?: string
  agencyName?: string
  agencyPhone?: string
  latitude?: number | null
  longitude?: number | null
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
  latitude?: number | null
  longitude?: number | null
  sellerType?: 'company' | 'private' | 'agency' | 'developer' | 'verified' | string | null
  images?: string[] | null
  description: string | null
  metadata: OfferMetadata | null
  createdAt: string
  updatedAt: string
}

export type SortBy = 'newest' | 'price_asc' | 'price_desc'

export interface ListOffersFilter {
  prompt?: string
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
  parsedFilters?: Record<string, unknown>
}
