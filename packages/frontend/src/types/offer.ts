export interface Offer {
  id: number
  portal: string
  externalId: string
  url: string
  title: string
  price: string | null
  areaSqm: string | null
  roomsCount: number | null
  city: string
  description: string | null
  metadata: Record<string, unknown> | null
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
