import { describe, it, expect, beforeEach } from 'vitest'
import {
  cacheOffers,
  getCachedOffer,
  prefetchImages,
  prefetchOffer,
  clearOfferCache,
} from '../offer-prefetch'
import type { Offer } from '../../types/offer'

const mockOffer: Offer = {
  id: 101,
  portal: 'sprzedajemy',
  externalId: 'sp-101',
  url: 'https://sprzedajemy.pl/oferta-101',
  title: 'Test offer title',
  price: 500000,
  areaSqm: 50,
  pricePerSqm: 10000,
  roomsCount: 2,
  city: 'Warszawa',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  description: 'Test description',
  metadata: {
    imageUrl: 'https://example.com/img1.jpg',
  },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

describe('offer-prefetch', () => {
  beforeEach(() => {
    clearOfferCache()
  })

  it('caches offers and retrieves them by id', () => {
    cacheOffers([mockOffer])
    expect(getCachedOffer(101)).toEqual(mockOffer)
    expect(getCachedOffer(999)).toBeUndefined()
  })

  it('prefetches images and records them without error', () => {
    const urls = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
    expect(() => prefetchImages(urls)).not.toThrow()
  })

  it('prefetches an offer object and caches it immediately', () => {
    prefetchOffer(mockOffer)
    expect(getCachedOffer(101)).toEqual(mockOffer)
  })
})
