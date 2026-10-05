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
  price: number | null
  areaSqm: number | null
  pricePerSqm?: number | null
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

export type SortBy =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'area_asc'
  | 'area_desc'
  | 'price_sqm_asc'
  | 'price_sqm_desc'

export const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort_newest' },
  { value: 'price_asc', labelKey: 'sort_price_asc' },
  { value: 'price_desc', labelKey: 'sort_price_desc' },
  { value: 'price_sqm_asc', labelKey: 'sort_price_sqm_asc' },
  { value: 'price_sqm_desc', labelKey: 'sort_price_sqm_desc' },
  { value: 'area_asc', labelKey: 'sort_area_asc' },
  { value: 'area_desc', labelKey: 'sort_area_desc' },
] as const satisfies readonly { value: SortBy; labelKey: string }[]

export type TransactionType = 'sale' | 'rent'
export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'garage' | 'other'
export type SellerType = 'private' | 'company' | 'agency' | 'developer' | 'verified'
export type MarketType = 'primary' | 'secondary'

export interface ListOffersFilter {
  prompt?: string
  q?: string
  city?: string
  district?: string
  portal?: string
  transactionType?: TransactionType
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  minRooms?: number
  maxRooms?: number
  minFloor?: number
  maxFloor?: number
  sellerType?: SellerType
  marketType?: MarketType
  hasElevator?: boolean
  hasBalcony?: boolean
  hasGarden?: boolean
  hasTerrace?: boolean
  hasParking?: boolean
  hasAirConditioning?: boolean
  isFurnished?: boolean
  hasBasement?: boolean
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
