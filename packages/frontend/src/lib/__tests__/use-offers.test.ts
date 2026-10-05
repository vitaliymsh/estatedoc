import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parseUrlFilters, syncUrlFilters } from '../../hooks/use-offers'

describe('parseUrlFilters & syncUrlFilters', () => {
  let originalWindow: typeof window

  beforeEach(() => {
    originalWindow = globalThis.window
    let search = ''
    let pathname = '/'
    let state: unknown = null

    globalThis.window = {
      location: {
        get search() {
          return search
        },
        get pathname() {
          return pathname
        },
      },
      history: {
        get state() {
          return state
        },
        replaceState(newState: unknown, _title: string, url: string) {
          state = newState
          const [p, s] = url.split('?')
          pathname = p || '/'
          search = s ? `?${s}` : ''
        },
      },
    } as unknown as Window & typeof globalThis
  })

  afterEach(() => {
    globalThis.window = originalWindow
  })

  it('parses empty query params correctly', () => {
    const filters = parseUrlFilters()
    expect(filters.prompt).toBeUndefined()
    expect(filters.city).toBeUndefined()
    expect(filters.sortBy).toBe('newest')
    expect(filters.page).toBe(1)
  })

  it('parses search prompt and page from query string', () => {
    window.history.replaceState({}, '', '/?prompt=kawalerka+warszawa&page=2&sortBy=price_asc')
    const filters = parseUrlFilters()
    expect(filters.prompt).toBe('kawalerka warszawa')
    expect(filters.page).toBe(2)
    expect(filters.sortBy).toBe('price_asc')
  })

  it('normalizes inverted min/max ranges in query string', () => {
    window.history.replaceState({}, '', '/?minPrice=1000000&maxPrice=500000&minArea=100&maxArea=50&minFloor=5&maxFloor=2')
    const filters = parseUrlFilters()
    expect(filters.minPrice).toBe(500000)
    expect(filters.maxPrice).toBe(1000000)
    expect(filters.minArea).toBe(50)
    expect(filters.maxArea).toBe(100)
    expect(filters.minFloor).toBe(2)
    expect(filters.maxFloor).toBe(5)
  })

  it('syncs filters to window location query string', () => {
    syncUrlFilters({
      prompt: 'mieszkanie krakow',
      sortBy: 'newest',
      page: 1,
    })
    expect(window.location.search).toBe('?prompt=mieszkanie+krakow')
  })
})
