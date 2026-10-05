import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  IGNORED_METADATA_KEYS,
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
  })

  it('formats metadata values', () => {
    expect(formatMetadataValue('plotSqm', 500)).toBe('Działka: 500 m²')
    expect(formatMetadataValue('buildingType', 'Kamienica')).toBe('Zabudowa: Kamienica')
    expect(formatMetadataValue('yearBuilt', 2020)).toBe('Rok budowy: 2020')
  })
})
