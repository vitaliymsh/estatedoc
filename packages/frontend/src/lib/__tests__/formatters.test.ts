import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatPricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  formatRelativeTime,
  buildGoogleMapsUrl,
  formatPropertyType,
  formatTransactionType,
  formatArea,
  formatPortal,
  formatRooms,
} from '../formatters'

describe('Frontend Formatters', () => {
  it('formats price in PLN and EN', () => {
    expect(formatPrice(599000)).toBe('599\u00A0000 zł')
    expect(formatPrice(null)).toBe('Cena do negocjacji')
    expect(formatPrice(599000, 'en')).toBe('599,000 PLN')
    expect(formatPrice(null, 'en')).toBe('Price negotiable')
  })

  it('formats price per sqm in PL and EN', () => {
    expect(formatPricePerSqm(13963)).toBe('13\u00A0963 zł/m²')
    expect(formatPricePerSqm(13963, 'en')).toBe('13,963 PLN/m²')
    expect(formatPricePerSqm(null)).toBeNull()
    expect(formatPricePerSqm(0)).toBeNull()
  })

  it('formats floor information in PL and EN', () => {
    expect(formatFloor(0, 5)).toBe('Parter/5')
    expect(formatFloor(0, null)).toBe('Parter')
    expect(formatFloor(3, 10)).toBe('Piętro 3/10')
    expect(formatFloor(3, null)).toBe('Piętro 3')
    expect(formatFloor(null, 4)).toBe('4 pięter')
    expect(formatFloor(null, null)).toBeNull()

    expect(formatFloor(0, 5, 'en')).toBe('Ground floor/5')
    expect(formatFloor(0, null, 'en')).toBe('Ground floor')
    expect(formatFloor(3, 10, 'en')).toBe('Floor 3/10')
    expect(formatFloor(null, 4, 'en')).toBe('4 floors')
  })

  it('formats seller type labels', () => {
    expect(formatSellerType('private')).toBe('Prywatne')
    expect(formatSellerType('company')).toBe('Biuro')
    expect(formatSellerType('agency')).toBe('Biuro')
    expect(formatSellerType('developer')).toBe('Deweloper')
    expect(formatSellerType('private', 'en')).toBe('Private')
    expect(formatSellerType('agency', 'en')).toBe('Agency')
    expect(formatSellerType(null)).toBeNull()
  })

  it('formats metadata values in PL and EN', () => {
    expect(formatMetadataValue('plotSqm', 500)).toBe('Działka: 500 m²')
    expect(formatMetadataValue('buildingType', 'Kamienica')).toBe('Zabudowa: Kamienica')
    expect(formatMetadataValue('yearBuilt', 2020)).toBe('Rok budowy: 2020')

    expect(formatMetadataValue('plotSqm', 500, 'en')).toBe('Plot: 500 m²')
    expect(formatMetadataValue('yearBuilt', 2020, 'en')).toBe('Year built: 2020')
  })

  it('formats relative freshness timestamps in PL and EN', () => {
    const now = new Date()
    expect(formatRelativeTime(now.toISOString())).toBe('Dodano dzisiaj')
    expect(formatRelativeTime(now.toISOString(), 'en')).toBe('Added today')

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(yesterday.toISOString())).toBe('Dodano wczoraj')
    expect(formatRelativeTime(yesterday.toISOString(), 'en')).toBe('Added yesterday')

    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('Dodano 3 dni temu')
    expect(formatRelativeTime(threeDaysAgo.toISOString(), 'en')).toBe('Added 3 days ago')

    expect(formatRelativeTime(null)).toBe('Niedawno dodane')
    expect(formatRelativeTime(null, 'en')).toBe('Recently added')
  })

  it('builds google maps search url with sanitized query', () => {
    expect(buildGoogleMapsUrl('Warszawa', 'Mokotów', 'Puławska')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Pu%C5%82awska%2C%20Mokot%C3%B3w%2C%20Warszawa'
    )
    expect(buildGoogleMapsUrl('Kraków')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Krak%C3%B3w'
    )
  })

  it('formats property and transaction types in PL and EN', () => {
    expect(formatPropertyType('apartment')).toBe('Mieszkanie')
    expect(formatPropertyType('house')).toBe('Dom')
    expect(formatPropertyType('apartment', 'en')).toBe('Apartment')
    expect(formatTransactionType('sale')).toBe('na sprzedaż')
    expect(formatTransactionType('rent')).toBe('na wynajem')
    expect(formatTransactionType('sale', 'en')).toBe('for sale')
    expect(formatTransactionType('rent', 'en')).toBe('for rent')
  })

  it('formats area by stripping trailing zeroes and handling invalid values', () => {
    expect(formatArea(70)).toBe('70 m²')
    expect(formatArea(147.5)).toBe('147.5 m²')
    expect(formatArea(28.05)).toBe('28.05 m²')
    expect(formatArea(0)).toBeNull()
    expect(formatArea(null)).toBeNull()
  })

  it('formats rent prices with monthly suffix and handles non-positive prices', () => {
    expect(formatPrice(3000, 'pl', 'rent')).toBe('3000 zł/mc')
    expect(formatPrice(30000, 'pl', 'rent')).toBe('30\u00A0000 zł/mc')
    expect(formatPrice(3000, 'en', 'rent')).toBe('3,000 PLN/mo')
    expect(formatPrice(0, 'pl')).toBe('Cena do negocjacji')
    expect(formatPrice(-500, 'pl')).toBe('Cena do negocjacji')
  })

  it('formats portal names with clean labels and white text on tinted badges', () => {
    expect(formatPortal('sprzedajemy').name).toBe('Sprzedajemy.pl')
    expect(formatPortal('sprzedajemy').badgeClassName).toContain('bg-amber-600')
    expect(formatPortal('sprzedajemy').badgeClassName).toContain('text-white')

    expect(formatPortal('morizon').name).toBe('Morizon.pl')
    expect(formatPortal('morizon').badgeClassName).toContain('bg-sky-600')
    expect(formatPortal('morizon').badgeClassName).toContain('text-white')

    expect(formatPortal('otodom').name).toBe('Otodom')
    expect(formatPortal('otodom').badgeClassName).toContain('bg-emerald-600')
    expect(formatPortal('otodom').badgeClassName).toContain('text-white')

    expect(formatPortal('gratka').name).toBe('Gratka')
    expect(formatPortal('gratka').badgeClassName).toContain('bg-amber-600')
    expect(formatPortal('gratka').badgeClassName).toContain('text-white')

    expect(formatPortal(null).name).toBe('Portal')
    expect(formatPortal(null).badgeClassName).toContain('text-white')
  })

  it('formats room counts in PL and EN including studio handling', () => {
    expect(formatRooms(1, 'pl')).toBe('1 pokój')
    expect(formatRooms(3, 'pl')).toBe('3 pokoje')
    expect(formatRooms(5, 'pl')).toBe('5 pokoi')
    expect(formatRooms(0, 'pl')).toBe('Kawalerka')
    expect(formatRooms(1, 'en')).toBe('1 room')
    expect(formatRooms(3, 'en')).toBe('3 rooms')
    expect(formatRooms(0, 'en')).toBe('Studio')
    expect(formatRooms(null, 'pl')).toBeNull()
  })
})
