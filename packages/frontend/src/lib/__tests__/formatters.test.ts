import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  IGNORED_METADATA_KEYS,
  formatRelativeTime,
  buildGoogleMapsUrl,
  formatPropertyType,
  formatTransactionType,
  normalizeOfferImages,
  formatDescriptionText,
} from '../formatters'

describe('Frontend Formatters', () => {
  it('formats price in PLN', () => {
    expect(formatPrice('599000.00')).toBe('599\u00A0000 zł')
    expect(formatPrice(null)).toBe('Cena do negocjacji')
  })

  it('calculates price per sqm', () => {
    expect(calculatePricePerSqm('599000', '42.9')).toBe('13\u00A0963 zł/m²')
    expect(calculatePricePerSqm(null, '50')).toBeNull()
  })

  it('formats floor information', () => {
    expect(formatFloor(0, 5)).toBe('Parter/5')
    expect(formatFloor(0, null)).toBe('Parter')
    expect(formatFloor(3, 10)).toBe('Piętro 3/10')
    expect(formatFloor(3, null)).toBe('Piętro 3')
    expect(formatFloor(null, 4)).toBe('4 pięter')
    expect(formatFloor(null, null)).toBeNull()
  })

  it('formats seller type labels', () => {
    expect(formatSellerType('private')).toBe('Prywatne')
    expect(formatSellerType('company')).toBe('Biuro')
    expect(formatSellerType('agency')).toBe('Biuro')
    expect(formatSellerType('developer')).toBe('Deweloper')
    expect(formatSellerType(null)).toBeNull()
  })

  it('filters internal metadata keys from badge rendering', () => {
    expect(IGNORED_METADATA_KEYS.has('images')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('imageUrl')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('availability')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('locality')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('streetAddress')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('floor')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('propertyType')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('transactionType')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('plotSqm')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('buildingType')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('yearBuilt')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('price')).toBe(true)
    expect(IGNORED_METADATA_KEYS.has('category')).toBe(true)
  })

  it('formats metadata values', () => {
    expect(formatMetadataValue('plotSqm', 500)).toBe('Działka: 500 m²')
    expect(formatMetadataValue('buildingType', 'Kamienica')).toBe('Zabudowa: Kamienica')
    expect(formatMetadataValue('yearBuilt', 2020)).toBe('Rok budowy: 2020')
  })

  it('formats relative freshness timestamps', () => {
    const now = new Date()
    expect(formatRelativeTime(now.toISOString())).toBe('Dodano dzisiaj')

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(yesterday.toISOString())).toBe('Dodano wczoraj')

    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('Dodano 3 dni temu')

    expect(formatRelativeTime(null)).toBe('Niedawno dodane')
  })

  it('builds google maps search url with sanitized query', () => {
    expect(buildGoogleMapsUrl('Warszawa', 'Mokotów', 'Puławska')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Pu%C5%82awska%2C%20Mokot%C3%B3w%2C%20Warszawa'
    )
    expect(buildGoogleMapsUrl('Kraków')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Krak%C3%B3w'
    )
  })

  it('formats property and transaction types', () => {
    expect(formatPropertyType('apartment')).toBe('Mieszkanie')
    expect(formatPropertyType('house')).toBe('Dom')
    expect(formatTransactionType('sale')).toBe('na sprzedaż')
    expect(formatTransactionType('rent')).toBe('na wynajem')
  })

  it('normalizes offer images from arrays, json strings, or metadata fallback', () => {
    expect(normalizeOfferImages(['https://example.com/1.jpg', 'https://example.com/2.jpg'])).toEqual([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ])
    expect(normalizeOfferImages('["https://example.com/1.jpg", "https://example.com/2.jpg"]')).toEqual([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ])
    expect(normalizeOfferImages('https://example.com/single.jpg')).toEqual([
      'https://example.com/single.jpg',
    ])
    expect(normalizeOfferImages(null, 'https://example.com/fallback.jpg')).toEqual([
      'https://example.com/fallback.jpg',
    ])
    expect(normalizeOfferImages(null, null)).toEqual([])
  })

  it('formats description text with clean paragraph and list spacing', () => {
    const raw = 'Mieszkanie na Mokotowie. BUDYNEK/OSIEDLE Mieszkanie na parterze. - Salon z kuchnią - Dwa pokoje'
    const formatted = formatDescriptionText(raw)
    expect(formatted).toContain('BUDYNEK/OSIEDLE')
    expect(formatted).toContain('• Salon z kuchnią')
    expect(formatted).toContain('• Dwa pokoje')
  })
})
