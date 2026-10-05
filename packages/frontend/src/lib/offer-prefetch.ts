import type { Offer } from '../types/offer'

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
    const images = offerOrId.images?.length
      ? offerOrId.images
      : offerOrId.metadata?.imageUrl
        ? [offerOrId.metadata.imageUrl]
        : []
    prefetchImages(images)
    return
  }

  const id = offerOrId
  if (offerCache.has(id)) {
    const cached = offerCache.get(id)!
    const images = cached.images?.length
      ? cached.images
      : cached.metadata?.imageUrl
        ? [cached.metadata.imageUrl]
        : []
    prefetchImages(images)
    return
  }

  // Fetch in background to warm cache
  fetch(`/api/offers/${id}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((offer: Offer | null) => {
      if (offer) {
        offerCache.set(offer.id, offer)
        const images = offer.images?.length
          ? offer.images
          : offer.metadata?.imageUrl
            ? [offer.metadata.imageUrl]
            : []
        prefetchImages(images)
      }
    })
    .catch(() => {
      // Ignore background prefetch network errors
    })
}
