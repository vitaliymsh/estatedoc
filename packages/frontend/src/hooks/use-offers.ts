import { useEffect, useState } from 'react'
import type { Offer, OffersResponse, ListOffersFilter, SortBy } from '../types/offer'
import { cacheOffers } from '../lib/offer-prefetch'
import { apiUrl } from '../lib/api-config'

export const PAGE_SIZE = 12

function parseRange(minVal: string | null, maxVal: string | null): [number | undefined, number | undefined] {
  const min = minVal ? Number(minVal) : undefined
  const max = maxVal ? Number(maxVal) : undefined
  return min !== undefined && max !== undefined && min > max ? [max, min] : [min, max]
}

export function parseUrlFilters(): ListOffersFilter {
  const params = new URLSearchParams(window.location.search)
  const [minPrice, maxPrice] = parseRange(params.get('minPrice'), params.get('maxPrice'))
  const [minArea, maxArea] = parseRange(params.get('minArea'), params.get('maxArea'))
  const [minRooms, maxRooms] = parseRange(params.get('minRooms'), params.get('maxRooms'))
  const [minFloor, maxFloor] = parseRange(params.get('minFloor'), params.get('maxFloor'))
  const parseBool = (k: string) => (params.has(k) ? params.get(k) === 'true' : undefined)
  const validSorts = ['newest', 'price_asc', 'price_desc', 'area_asc', 'area_desc', 'price_sqm_asc', 'price_sqm_desc']
  const sortByParam = params.get('sortBy')

  return {
    prompt: params.get('prompt') || undefined,
    q: params.get('q') || undefined,
    city: params.get('city') || undefined,
    district: params.get('district') || undefined,
    portal: params.get('portal') || undefined,
    transactionType: (params.get('transactionType') as ListOffersFilter['transactionType']) || undefined,
    propertyType: (params.get('propertyType') as ListOffersFilter['propertyType']) || undefined,
    sellerType: (params.get('sellerType') as ListOffersFilter['sellerType']) || undefined,
    marketType: (params.get('marketType') as ListOffersFilter['marketType']) || undefined,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    minRooms,
    maxRooms,
    minFloor,
    maxFloor,
    hasElevator: parseBool('hasElevator'),
    hasBalcony: parseBool('hasBalcony'),
    hasParking: parseBool('hasParking'),
    hasAirConditioning: parseBool('hasAirConditioning'),
    isFurnished: parseBool('isFurnished'),
    hasBasement: parseBool('hasBasement'),
    sortBy: validSorts.includes(sortByParam || '') ? (sortByParam as SortBy) : 'newest',
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}

export function syncUrlFilters(filter: ListOffersFilter) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== '' && !(key === 'sortBy' && value === 'newest') && !(key === 'page' && value === 1)) {
      params.set(key, String(value))
    }
  }
  const queryString = params.toString()
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  window.history.replaceState(window.history.state, '', newUrl)
}

export function getStoredTemporaryKey(): string | null {
  try {
    return window.localStorage?.getItem('temporaryKey') ?? null
  } catch {
    return null
  }
}

export function setStoredTemporaryKey(key: string) {
  try {
    window.localStorage?.setItem('temporaryKey', key)
  } catch {}
}

export function removeStoredTemporaryKey() {
  try {
    window.localStorage?.removeItem('temporaryKey')
  } catch {}
}

export interface IngestOptions {
  portal?: 'all' | 'sprzedajemy' | 'morizon' | 'otodom' | 'gratka'
  maxPages?: number
}

export function useOffers() {
  const [temporaryKey, setTemporaryKeyState] = useState<string | null>(getStoredTemporaryKey)
  const [isKeyRequired, setIsKeyRequired] = useState(() => !getStoredTemporaryKey())
  const [isVerifyingKey, setIsVerifyingKey] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ListOffersFilter>(parseUrlFilters)
  const [searchInput, setSearchInput] = useState(filter.prompt || filter.q || '')
  const [parsedFilters, setParsedFilters] = useState<Record<string, unknown> | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refetch = () => setRefreshCount((c) => c + 1)

  const handleSetTemporaryKey = async (key: string) => {
    setIsVerifyingKey(true)
    setKeyError(null)
    try {
      const res = await fetch(apiUrl('/api/offers/verify-key'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-temporary-key': key,
        },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) {
        removeStoredTemporaryKey()
        setKeyError('Invalid access key. Please try again.')
        return false
      }
      setStoredTemporaryKey(key)
      setTemporaryKeyState(key)
      setIsKeyRequired(false)
      setKeyError(null)
      refetch()
      return true
    } catch {
      setKeyError('Connection error. Please try again.')
      return false
    } finally {
      setIsVerifyingKey(false)
    }
  }

  const triggerSync = async (options?: IngestOptions) => {
    setIsSyncing(true)
    try {
      const res = await fetch(apiUrl('/api/dev/ingest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(temporaryKey ? { 'x-temporary-key': temporaryKey } : {}),
        },
        body: JSON.stringify({
          portal: options?.portal ?? 'all',
          maxPages: options?.maxPages ?? 1,
        }),
      })
      if (res.status === 401) {
        removeStoredTemporaryKey()
        setTemporaryKeyState(null)
        setIsKeyRequired(true)
        setKeyError('Invalid access key. Please try again.')
        return { ok: false, error: 'Unauthorized' }
      }
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
    setFilter((prev) => (prev.prompt === text ? prev : { ...prev, prompt: text, q: undefined, page: 1 }))
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setParsedFilters(null)
    setFilter((prev) => (!prev.prompt && !prev.q && prev.page === 1 ? prev : { ...prev, prompt: undefined, q: undefined, page: 1 }))
  }

  // Fetch from backend API
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    const offset = (filter.page - 1) * PAGE_SIZE
    const authHeaders: Record<string, string> = temporaryKey ? { 'x-temporary-key': temporaryKey } : {}

    const fetchPromise = filter.prompt
      ? fetch(apiUrl('/api/offers/search'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify({
            prompt: filter.prompt,
            limit: PAGE_SIZE,
            offset,
          }),
          signal: controller.signal,
        })
      : (() => {
          const params = new URLSearchParams(
            Object.entries(filter)
              .filter(([k, v]) => v !== undefined && k !== 'prompt' && k !== 'page')
              .map(([k, v]) => [k, String(v)])
          )
          params.set('limit', String(PAGE_SIZE))
          params.set('offset', String(offset))
          return fetch(apiUrl(`/api/offers?${params}`), {
            headers: authHeaders,
            signal: controller.signal,
          })
        })()

    fetchPromise
      .then((res) => {
        if (res.status === 401) {
          removeStoredTemporaryKey()
          setTemporaryKeyState(null)
          setIsKeyRequired(true)
          setKeyError('Invalid access key. Please try again.')
          return null
        }
        return res.ok ? res.json() : null
      })
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
  }, [filter, refreshCount, temporaryKey])

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
    temporaryKey,
    isKeyRequired,
    isVerifyingKey,
    keyError,
    handleSetTemporaryKey,
    setIsKeyRequired,
  }
}
