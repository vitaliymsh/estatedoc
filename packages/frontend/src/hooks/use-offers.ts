import { useEffect, useState, useRef } from 'react'
import type { Offer, OffersResponse, ListOffersFilter, SortBy } from '../types/offer'
import { SAMPLE_OFFERS } from '../mocks/offers'

export const PAGE_SIZE = 12

export function parseUrlFilters(): ListOffersFilter {
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q') || undefined
  const city = params.get('city') || undefined
  const portal = params.get('portal') || undefined
  const minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined
  const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined
  const sortByParam = params.get('sortBy')
  const sortBy: SortBy =
    sortByParam === 'price_asc' || sortByParam === 'price_desc' || sortByParam === 'newest'
      ? sortByParam
      : 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  return { q, city, portal, minPrice, maxPrice, sortBy, page }
}

export function syncUrlFilters(filter: ListOffersFilter) {
  const params = new URLSearchParams()
  if (filter.q) params.set('q', filter.q)
  if (filter.city) params.set('city', filter.city)
  if (filter.portal) params.set('portal', filter.portal)
  if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice))
  if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice))
  if (filter.sortBy !== 'newest') params.set('sortBy', filter.sortBy)
  if (filter.page > 1) params.set('page', String(filter.page))

  const queryString = params.toString()
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.replaceState(null, '', newUrl)
}

function filterMockOffers(offers: Offer[], filter: ListOffersFilter): { items: Offer[]; total: number } {
  let result = [...offers]

  if (filter.q) {
    const qLower = filter.q.toLowerCase()
    result = result.filter(
      (o) =>
        o.title.toLowerCase().includes(qLower) ||
        o.city.toLowerCase().includes(qLower) ||
        (o.description && o.description.toLowerCase().includes(qLower))
    )
  }

  if (filter.city) {
    result = result.filter((o) => o.city.toLowerCase() === filter.city!.toLowerCase())
  }

  if (filter.portal) {
    result = result.filter((o) => o.portal.toLowerCase() === filter.portal!.toLowerCase())
  }

  if (filter.minPrice !== undefined) {
    result = result.filter((o) => o.price && Number(o.price) >= filter.minPrice!)
  }

  if (filter.maxPrice !== undefined) {
    result = result.filter((o) => o.price && Number(o.price) <= filter.maxPrice!)
  }

  if (filter.sortBy === 'price_asc') {
    result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  } else if (filter.sortBy === 'price_desc') {
    result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
  } else {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = result.length
  const offset = (filter.page - 1) * PAGE_SIZE
  const items = result.slice(offset, offset + PAGE_SIZE)
  return { items, total }
}

export function useOffers() {
  const [filter, setFilter] = useState<ListOffersFilter>(parseUrlFilters)
  const [searchInput, setSearchInput] = useState(filter.q || '')
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // URL Query sync
  useEffect(() => {
    syncUrlFilters(filter)
  }, [filter])

  // Debounced search query
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilter((prev) => ({ ...prev, q: value.trim() || undefined, page: 1 }))
    }, 350)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFilter((prev) => ({ ...prev, q: undefined, page: 1 }))
  }

  // Fetch from backend API / fallback
  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    const params = new URLSearchParams()
    if (filter.q) params.set('q', filter.q)
    if (filter.city) params.set('city', filter.city)
    if (filter.portal) params.set('portal', filter.portal)
    if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice))
    if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice))
    params.set('sortBy', filter.sortBy)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String((filter.page - 1) * PAGE_SIZE))

    fetch(`/api/offers?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OffersResponse | null) => {
        if (isCancelled) return
        if (data && typeof data.total === 'number') {
          setOffers(data.items)
          setTotal(data.total)
        } else {
          const mockResult = filterMockOffers(SAMPLE_OFFERS, filter)
          setOffers(mockResult.items)
          setTotal(mockResult.total)
        }
      })
      .catch(() => {
        if (isCancelled) return
        const mockResult = filterMockOffers(SAMPLE_OFFERS, filter)
        setOffers(mockResult.items)
        setTotal(mockResult.total)
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [filter])

  const resetFilters = () => {
    setSearchInput('')
    setFilter({ sortBy: 'newest', page: 1 })
  }

  return {
    filter,
    setFilter,
    searchInput,
    handleSearchChange,
    handleClearSearch,
    offers,
    total,
    loading,
    resetFilters,
  }
}
