import { useEffect, useState } from 'react'
import type { Offer, OffersResponse, ListOffersFilter, SortBy } from '../types/offer'
import { cacheOffers } from '../lib/offer-prefetch'

export const PAGE_SIZE = 12

export function parseUrlFilters(): ListOffersFilter {
  const params = new URLSearchParams(window.location.search)
  const prompt = params.get('prompt') || undefined
  const q = params.get('q') || undefined
  const city = params.get('city') || undefined
  const district = params.get('district') || undefined
  const portal = params.get('portal') || undefined
  const transactionType = (params.get('transactionType') as ListOffersFilter['transactionType']) || undefined
  const propertyType = (params.get('propertyType') as ListOffersFilter['propertyType']) || undefined
  const sellerType = (params.get('sellerType') as ListOffersFilter['sellerType']) || undefined
  const marketType = (params.get('marketType') as ListOffersFilter['marketType']) || undefined
  let minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined
  let maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    const tmp = minPrice
    minPrice = maxPrice
    maxPrice = tmp
  }

  let minArea = params.get('minArea') ? Number(params.get('minArea')) : undefined
  let maxArea = params.get('maxArea') ? Number(params.get('maxArea')) : undefined
  if (minArea !== undefined && maxArea !== undefined && minArea > maxArea) {
    const tmp = minArea
    minArea = maxArea
    maxArea = tmp
  }

  let minRooms = params.get('minRooms') ? Number(params.get('minRooms')) : undefined
  let maxRooms = params.get('maxRooms') ? Number(params.get('maxRooms')) : undefined
  if (minRooms !== undefined && maxRooms !== undefined && minRooms > maxRooms) {
    const tmp = minRooms
    minRooms = maxRooms
    maxRooms = tmp
  }

  let minFloor = params.get('minFloor') ? Number(params.get('minFloor')) : undefined
  let maxFloor = params.get('maxFloor') ? Number(params.get('maxFloor')) : undefined
  if (minFloor !== undefined && maxFloor !== undefined && minFloor > maxFloor) {
    const tmp = minFloor
    minFloor = maxFloor
    maxFloor = tmp
  }

  const hasElevator = params.has('hasElevator') ? params.get('hasElevator') === 'true' : undefined
  const hasBalcony = params.has('hasBalcony') ? params.get('hasBalcony') === 'true' : undefined
  const hasParking = params.has('hasParking') ? params.get('hasParking') === 'true' : undefined
  const hasAirConditioning = params.has('hasAirConditioning') ? params.get('hasAirConditioning') === 'true' : undefined
  const isFurnished = params.has('isFurnished') ? params.get('isFurnished') === 'true' : undefined
  const hasBasement = params.has('hasBasement') ? params.get('hasBasement') === 'true' : undefined

  const validSorts = ['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'price_sqm_asc', 'price_sqm_desc']
  const sortByParam = params.get('sortBy')
  const sortBy: SortBy = validSorts.includes(sortByParam || '') ? (sortByParam as SortBy) : 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  return {
    prompt,
    q,
    city,
    district,
    portal,
    transactionType,
    propertyType,
    sellerType,
    marketType,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    minRooms,
    maxRooms,
    minFloor,
    maxFloor,
    hasElevator,
    hasBalcony,
    hasParking,
    hasAirConditioning,
    isFurnished,
    hasBasement,
    sortBy,
    page,
  }
}

export function syncUrlFilters(filter: ListOffersFilter) {
  const params = new URLSearchParams(window.location.search)
  if (filter.prompt) params.set('prompt', filter.prompt); else params.delete('prompt')
  if (filter.q) params.set('q', filter.q); else params.delete('q')
  if (filter.city) params.set('city', filter.city); else params.delete('city')
  if (filter.district) params.set('district', filter.district); else params.delete('district')
  if (filter.portal) params.set('portal', filter.portal); else params.delete('portal')
  if (filter.transactionType) params.set('transactionType', filter.transactionType); else params.delete('transactionType')
  if (filter.propertyType) params.set('propertyType', filter.propertyType); else params.delete('propertyType')
  if (filter.sellerType) params.set('sellerType', filter.sellerType); else params.delete('sellerType')
  if (filter.marketType) params.set('marketType', filter.marketType); else params.delete('marketType')
  if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice)); else params.delete('minPrice')
  if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice)); else params.delete('maxPrice')
  if (filter.minArea !== undefined) params.set('minArea', String(filter.minArea)); else params.delete('minArea')
  if (filter.maxArea !== undefined) params.set('maxArea', String(filter.maxArea)); else params.delete('maxArea')
  if (filter.minRooms !== undefined) params.set('minRooms', String(filter.minRooms)); else params.delete('minRooms')
  if (filter.maxRooms !== undefined) params.set('maxRooms', String(filter.maxRooms)); else params.delete('maxRooms')
  if (filter.minFloor !== undefined) params.set('minFloor', String(filter.minFloor)); else params.delete('minFloor')
  if (filter.maxFloor !== undefined) params.set('maxFloor', String(filter.maxFloor)); else params.delete('maxFloor')
  if (filter.hasElevator !== undefined) params.set('hasElevator', String(filter.hasElevator)); else params.delete('hasElevator')
  if (filter.hasBalcony !== undefined) params.set('hasBalcony', String(filter.hasBalcony)); else params.delete('hasBalcony')
  if (filter.hasParking !== undefined) params.set('hasParking', String(filter.hasParking)); else params.delete('hasParking')
  if (filter.hasAirConditioning !== undefined) params.set('hasAirConditioning', String(filter.hasAirConditioning)); else params.delete('hasAirConditioning')
  if (filter.isFurnished !== undefined) params.set('isFurnished', String(filter.isFurnished)); else params.delete('isFurnished')
  if (filter.hasBasement !== undefined) params.set('hasBasement', String(filter.hasBasement)); else params.delete('hasBasement')
  if (filter.sortBy !== 'newest') params.set('sortBy', filter.sortBy); else params.delete('sortBy')
  if (filter.page > 1) params.set('page', String(filter.page)); else params.delete('page')

  const queryString = params.toString()
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.replaceState(window.history.state, '', newUrl)
}

export interface IngestOptions {
  portal?: 'all' | 'sprzedajemy' | 'morizon'
  maxPages?: number
}

export function useOffers() {
  const [filter, setFilter] = useState<ListOffersFilter>(parseUrlFilters)
  const [searchInput, setSearchInput] = useState(filter.prompt || filter.q || '')
  const [parsedFilters, setParsedFilters] = useState<Record<string, unknown> | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refetch = () => setRefreshCount((c) => c + 1)

  const triggerSync = async (options?: IngestOptions) => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/dev/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: options?.portal ?? 'all',
          maxPages: options?.maxPages ?? 1,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Ingestion failed')
      }
      refetch()
      return { ok: true, message: data?.message || 'Zakończono pobieranie' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Sync error:', err)
      return { ok: false, error: msg }
    } finally {
      setIsSyncing(false)
    }
  }

  // URL Query sync
  useEffect(() => {
    syncUrlFilters(filter)
  }, [filter])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  const handleSearchSubmit = (value?: string) => {
    const text = (value ?? searchInput).trim() || undefined
    setFilter((prev) => {
      if (prev.prompt === text) return prev
      return {
        ...prev,
        prompt: text,
        q: undefined,
        page: 1,
      }
    })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setParsedFilters(null)
    setFilter((prev) => {
      if (!prev.prompt && !prev.q && prev.page === 1) return prev
      return { ...prev, prompt: undefined, q: undefined, page: 1 }
    })
  }

  // Fetch from backend API
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    const offset = (filter.page - 1) * PAGE_SIZE

    const fetchPromise = filter.prompt
      ? fetch('/api/offers/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: filter.prompt,
            limit: PAGE_SIZE,
            offset,
          }),
          signal: controller.signal,
        })
      : (() => {
          const params = new URLSearchParams()
          if (filter.q) params.set('q', filter.q)
          if (filter.city) params.set('city', filter.city)
          if (filter.district) params.set('district', filter.district)
          if (filter.portal) params.set('portal', filter.portal)
          if (filter.transactionType) params.set('transactionType', filter.transactionType)
          if (filter.propertyType) params.set('propertyType', filter.propertyType)
          if (filter.sellerType) params.set('sellerType', filter.sellerType)
          if (filter.marketType) params.set('marketType', filter.marketType)
          if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice))
          if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice))
          if (filter.minArea !== undefined) params.set('minArea', String(filter.minArea))
          if (filter.maxArea !== undefined) params.set('maxArea', String(filter.maxArea))
          if (filter.minRooms !== undefined) params.set('minRooms', String(filter.minRooms))
          if (filter.maxRooms !== undefined) params.set('maxRooms', String(filter.maxRooms))
          if (filter.minFloor !== undefined) params.set('minFloor', String(filter.minFloor))
          if (filter.maxFloor !== undefined) params.set('maxFloor', String(filter.maxFloor))
          if (filter.hasElevator !== undefined) params.set('hasElevator', String(filter.hasElevator))
          if (filter.hasBalcony !== undefined) params.set('hasBalcony', String(filter.hasBalcony))
          if (filter.hasParking !== undefined) params.set('hasParking', String(filter.hasParking))
          if (filter.hasAirConditioning !== undefined) params.set('hasAirConditioning', String(filter.hasAirConditioning))
          if (filter.isFurnished !== undefined) params.set('isFurnished', String(filter.isFurnished))
          if (filter.hasBasement !== undefined) params.set('hasBasement', String(filter.hasBasement))
          params.set('sortBy', filter.sortBy)
          params.set('limit', String(PAGE_SIZE))
          params.set('offset', String(offset))
          return fetch(`/api/offers?${params.toString()}`, { signal: controller.signal })
        })()

    fetchPromise
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OffersResponse | null) => {
        if (data && typeof data.total === 'number') {
          setOffers(data.items)
          setTotal(data.total)
          setParsedFilters(data.parsedFilters ?? null)
          cacheOffers(data.items)
        } else {
          setOffers([])
          setTotal(0)
          setParsedFilters(null)
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setOffers([])
          setTotal(0)
          setParsedFilters(null)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [filter, refreshCount])

  const resetFilters = () => {
    setSearchInput('')
    setParsedFilters(null)
    setFilter({ sortBy: 'newest', page: 1 })
  }

  return {
    filter,
    setFilter,
    searchInput,
    parsedFilters,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
    offers,
    total,
    loading,
    refetch,
    isSyncing,
    triggerSync,
    resetFilters,
  }
}
