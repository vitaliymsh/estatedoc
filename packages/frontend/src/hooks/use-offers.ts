import { useEffect, useState, useRef } from 'react'
import type { Offer, OffersResponse, ListOffersFilter, SortBy } from '../types/offer'
import { cacheOffers } from '../lib/offer-prefetch'

export const PAGE_SIZE = 12

export function parseUrlFilters(): ListOffersFilter {
  const params = new URLSearchParams(window.location.search)
  const prompt = params.get('prompt') || undefined
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

  return { prompt, q, city, portal, minPrice, maxPrice, sortBy, page }
}

export function syncUrlFilters(filter: ListOffersFilter) {
  const params = new URLSearchParams(window.location.search)
  if (filter.prompt) params.set('prompt', filter.prompt); else params.delete('prompt')
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
  const [searchInput, setSearchInput] = useState(filter.prompt || filter.q || '')
  const [parsedFilters, setParsedFilters] = useState<Record<string, unknown> | null>(null)
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

  // Debounced search query or prompt submit
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilter((prev) => ({
        ...prev,
        prompt: value.trim() ? value.trim() : undefined,
        q: undefined,
        page: 1,
      }))
    }, 400)
  }

  const handleSearchSubmit = (value?: string) => {
    const text = (value ?? searchInput).trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setFilter((prev) => ({
      ...prev,
      prompt: text || undefined,
      q: undefined,
      page: 1,
    }))
  }

  const handleClearSearch = () => {
    setSearchInput('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setParsedFilters(null)
    setFilter((prev) => ({ ...prev, prompt: undefined, q: undefined, page: 1 }))
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
          if (filter.portal) params.set('portal', filter.portal)
          if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice))
          if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice))
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
