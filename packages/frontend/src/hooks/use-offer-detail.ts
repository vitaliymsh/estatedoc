import { useState, useEffect } from 'react'
import type { Offer } from '../types/offer'
import { getCachedOffer, cacheOffers, prefetchImages } from '../lib/offer-prefetch'
import { normalizeOfferImages } from '../lib/formatters'

export function useOfferDetail(id: number | null) {
  const [data, setData] = useState<{ id: number | null; offer: Offer | null }>({
    id,
    offer: id ? getCachedOffer(id) || null : null,
  })
  const [loading, setLoading] = useState<boolean>(() => Boolean(id && !getCachedOffer(id)))
  const [error, setError] = useState<string | null>(null)

  const offer = data.id === id ? data.offer : (id ? getCachedOffer(id) || null : null)

  useEffect(() => {
    if (!id) {
      setData({ id: null, offer: null })
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const cached = getCachedOffer(id)
    if (cached) {
      setData({ id, offer: cached })
      setLoading(false)
      prefetchImages(normalizeOfferImages(cached.images, cached.metadata?.imageUrl))
    } else {
      setLoading(true)
    }

    fetch(`/api/offers/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Offer fetch failed: ${res.statusText}`)
        }
        return res.json()
      })
      .then((fresh: Offer) => {
        setData({ id, offer: fresh })
        cacheOffers([fresh])
        prefetchImages(normalizeOfferImages(fresh.images, fresh.metadata?.imageUrl))
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !cached) {
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
