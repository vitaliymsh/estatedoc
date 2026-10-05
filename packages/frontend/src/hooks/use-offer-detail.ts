import { useState, useEffect } from 'react'
import type { Offer } from '../types/offer'
import { getCachedOffer, cacheOffers, prefetchImages } from '../lib/offer-prefetch'
import { apiUrl } from '../lib/api-config'

export function useOfferDetail(id: number | null) {
  const [remoteOffer, setRemoteOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(id && !getCachedOffer(id)))
  const [error, setError] = useState<string | null>(null)

  const cached = id ? getCachedOffer(id) : undefined
  const offer = (remoteOffer?.id === id ? remoteOffer : cached) ?? null

  useEffect(() => {
    if (!id) {
      setRemoteOffer(null)
      setLoading(false)
      setError(null)
      return
    }

    const currentCached = getCachedOffer(id)
    if (currentCached) {
      setLoading(false)
      prefetchImages(currentCached.images || [])
    } else {
      setLoading(true)
    }

    const controller = new AbortController()
    fetch(apiUrl(`/api/offers/${id}`), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Offer fetch failed: ${res.statusText}`)
        }
        return res.json()
      })
      .then((fresh: Offer) => {
        setRemoteOffer(fresh)
        cacheOffers([fresh])
        prefetchImages(fresh.images || [])
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !currentCached) {
          setError(err instanceof Error ? err.message : 'Nie znaleziono oferty')
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
  }, [id])

  return { offer, loading, error }
}

