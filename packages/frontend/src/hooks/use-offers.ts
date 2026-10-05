import { useEffect, useState, useRef } from 'react'
import type { Offer, OffersResponse, ListOffersFilter, SortBy } from '../types/offer'
import { cacheOffers } from '../lib/offer-prefetch'

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
  const params = new URLSearchParams(window.location.search)
  if (filter.q) params.set('q', filter.q); else params.delete('q')
  if (filter.city) params.set('city', filter.city); else params.delete('city')
  if (filter.portal) params.set('portal', filter.portal); else params.delete('portal')
  if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice)); else params.delete('minPrice')
  if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice)); else params.delete('maxPrice')
  if (filter.sortBy !== 'newest') params.set('sortBy', filter.sortBy); else params.delete('sortBy')
  if (filter.page > 1) params.set('page', String(filter.page)); else params.delete('page')

  const queryString = params.toString()
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.replaceState(window.history.state, '', newUrl)
}

export function useOffers() {
  const [filter, setFilter] = useState<ListOffersFilter>(parseUrlFilters)
  const [searchInput, setSearchInput] = useState(filter.q || '')
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refetch = () => setRefreshCount((c) => c + 1)

  const triggerSync = async (maxPages: number = 1) => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/dev/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: 'all', maxPages }),
      })
      if (!res.ok) {
        throw new Error('Ingestion failed')
      }
      refetch()
      return { ok: true }
    } catch (err) {
      console.error('Sync error:', err)
      return { ok: false, error: err }
    } finally {
      setIsSyncing(false)
    }
  }

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

  // Fetch from backend API
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
          cacheOffers(data.items)
        } else {
          setOffers([])
          setTotal(0)
        }
      })
      .catch(() => {
        if (isCancelled) return
        setOffers([])
        setTotal(0)
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [filter, refreshCount])

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
    refetch,
    isSyncing,
    triggerSync,
    resetFilters,
  }
}
