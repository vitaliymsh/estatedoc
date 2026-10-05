import { useState, useEffect } from 'react'
import type { Offer } from '../types/offer'
import { getCachedOffer, cacheOffers, prefetchImages } from '../lib/offer-prefetch'

export function useOfferDetail(id: number | null) {
  const getInitialOffer = (): Offer | null => {
    if (!id) return null
    return getCachedOffer(id) || null
  }

  const [offer, setOffer] = useState<Offer | null>(getInitialOffer)
  const [loading, setLoading] = useState<boolean>(() => {
    if (!id) return false
    return !getInitialOffer()
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setOffer(null)
      setLoading(false)
      setError(null)
      return
    }

    const initial = getInitialOffer()
    if (initial) {
      setOffer(initial)
      setLoading(false)
      const images = initial.images?.length
        ? initial.images
        : initial.metadata?.imageUrl
          ? [initial.metadata.imageUrl]
          : []
      prefetchImages(images)
    } else {
      setLoading(true)
    }

    let isCancelled = false
    fetch(`/api/offers/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Offer fetch failed: ${res.statusText}`)
        }
        return res.json()
      })
      .then((data: Offer) => {
        if (isCancelled) return
        setOffer(data)
        cacheOffers([data])
        const images = data.images?.length
          ? data.images
          : data.metadata?.imageUrl
            ? [data.metadata.imageUrl]
            : []
        prefetchImages(images)
        setError(null)
      })
      .catch((err) => {
        if (isCancelled) return
        if (!initial) {
          setError(err instanceof Error ? err.message : 'Nie znaleziono oferty')
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [id])

  return { offer, loading, error }
}
