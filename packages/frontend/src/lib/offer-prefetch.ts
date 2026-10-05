import type { Offer } from '../types/offer'

const MAX_OFFER_CACHE_SIZE = 500
const MAX_IMAGE_CACHE_SIZE = 1000

export const offerCache = new Map<number, Offer>()
const prefetchedImageUrls = new Set<string>()

export function clearOfferCache(): void {
  offerCache.clear()
  prefetchedImageUrls.clear()
}

function setCachedOffer(offer: Offer): void {
  if (offerCache.size >= MAX_OFFER_CACHE_SIZE) {
    const firstKey = offerCache.keys().next().value
    if (firstKey !== undefined) offerCache.delete(firstKey)
  }
  offerCache.set(offer.id, offer)
}

export function cacheOffers(offers: Offer[]): void {
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i]
    if (offer) setCachedOffer(offer)
  }
}

export const getCachedOffer = (id: number): Offer | undefined => offerCache.get(id)

export function prefetchImages(urls: (string | null | undefined)[]): void {
  if (typeof window === 'undefined') return
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    if (url && !prefetchedImageUrls.has(url)) {
      if (prefetchedImageUrls.size >= MAX_IMAGE_CACHE_SIZE) {
        const firstUrl = prefetchedImageUrls.values().next().value
        if (firstUrl) prefetchedImageUrls.delete(firstUrl)
      }
      prefetchedImageUrls.add(url)
      const img = new Image()
      img.referrerPolicy = 'no-referrer'
      img.decoding = 'async'
      img.src = url
    }
  }
}

export function prefetchOffer(offerOrId: Offer | number): void {
  const offer = typeof offerOrId === 'object' && offerOrId !== null ? offerOrId : offerCache.get(offerOrId)
  if (offer) {
    setCachedOffer(offer)
    if (offer.images && offer.images.length > 0) {
      prefetchImages(offer.images)
    }
  }
}

