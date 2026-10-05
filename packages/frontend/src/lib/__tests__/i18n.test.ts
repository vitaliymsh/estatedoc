import { describe, it, expect } from 'vitest'
import { getTranslation } from '../i18n'

describe('i18n', () => {
  it('returns Polish text by default or when lang is pl', () => {
    expect(getTranslation('pl', 'filters')).toBe('Filtry')
    expect(getTranslation('pl', 'sort_newest')).toBe('Najnowsze')
    expect(getTranslation('pl', 'all_cities')).toBe('Wszystkie miasta')
  })

  it('returns English text when lang is en', () => {
    expect(getTranslation('en', 'filters')).toBe('Filters')
    expect(getTranslation('en', 'sort_newest')).toBe('Newest')
    expect(getTranslation('en', 'all_cities')).toBe('All cities')
  })

  it('interpolates template parameters', () => {
    expect(getTranslation('pl', 'in_city', { city: 'Warszawa' })).toBe(' w: Warszawa')
    expect(getTranslation('en', 'in_city', { city: 'Warszawa' })).toBe(' in: Warszawa')
  })

  it('falls back gracefully on unknown key', () => {
    // @ts-expect-error testing invalid key
    expect(getTranslation('en', 'non_existing_key')).toBe('non_existing_key')
  })
})
