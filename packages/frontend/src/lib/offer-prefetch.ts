import type { Offer } from '../types/offer'
import { apiUrl } from './api-config'

export const offerCache = new Map<number, Offer>()
const prefetchedImageUrls = new Set<string>()

export function clearOfferCache() {
  offerCache.clear()
  prefetchedImageUrls.clear()
}

export function cacheOffers(offers: Offer[]) {
  for (const offer of offers) {
    offerCache.set(offer.id, offer)
  }
}

export function getCachedOffer(id: number): Offer | undefined {
  return offerCache.get(id)
}

export function prefetchImages(urls: (string | null | undefined)[]) {
  if (typeof window === 'undefined') return
  for (const url of urls) {
    if (url && !prefetchedImageUrls.has(url)) {
      prefetchedImageUrls.add(url)
      const img = new Image()
      img.referrerPolicy = 'no-referrer'
      img.src = url
    }
  }
}

export function prefetchOffer(offerOrId: Offer | number): void {
  if (typeof offerOrId === 'object' && offerOrId !== null) {
    offerCache.set(offerOrId.id, offerOrId)
    prefetchImages(offerOrId.images || [])
    return
  }

  const cached = offerCache.get(offerOrId)
  if (cached) {
    prefetchImages(cached.images || [])
    return
  }

  fetch(apiUrl(`/api/offers/${offerOrId}`))
    .then((res) => (res.ok ? res.json() : null))
    .then((offer: Offer | null) => {
      if (offer) {
        offerCache.set(offer.id, offer)
        prefetchImages(offer.images || [])
      }
    })
    .catch(() => {})
}
