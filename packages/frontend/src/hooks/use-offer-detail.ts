import { useState, useEffect } from 'react'
import type { Offer } from '../types/offer'
import { getCachedOffer, cacheOffers, prefetchImages } from '../lib/offer-prefetch'
import { apiUrl } from '../lib/api-config'

export function useOfferDetail(id: number | null) {
  const cached = id ? getCachedOffer(id) : undefined
  const [offer, setOffer] = useState<Offer | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached && Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setOffer(null)
      setLoading(false)
      setError(null)
      return
    }

    const currentCached = getCachedOffer(id)
    setOffer(currentCached ?? null)
    setLoading(!currentCached)
    if (currentCached?.images) prefetchImages(currentCached.images)

    const controller = new AbortController()
    fetch(apiUrl(`/api/offers/${id}`), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Offer fetch failed: ${res.statusText}`)
        return res.json()
      })
      .then((fresh: Offer) => {
        setOffer(fresh)
        cacheOffers([fresh])
        if (fresh.images) prefetchImages(fresh.images)
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !currentCached) {
          setError(err instanceof Error ? err.message : 'Nie znaleziono oferty')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [id])

  return { offer, loading, error }
}

