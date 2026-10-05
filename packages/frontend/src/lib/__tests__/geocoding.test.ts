import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractCoordinates,
  getStaticCoordinates,
  geocodeWithNominatim,
  resolveOfferCoordinates,
  clearGeocodeCache,
  POLAND_CENTER_COORDINATES,
  extractLocationFromTitle,
  getEffectiveLocation,
} from '../geocoding'
import type { Offer } from '../../types/offer'

describe('Geocoding & Coordinates Resolver', () => {
  beforeEach(() => {
    clearGeocodeCache()
    vi.restoreAllMocks()
  })

  describe('extractCoordinates', () => {
    it('extracts top-level coordinates from offer', () => {
      const offer = {
        city: 'Warszawa',
        latitude: 52.23,
        longitude: 21.01,
      } as unknown as Offer

      expect(extractCoordinates(offer)).toEqual({ lat: 52.23, lng: 21.01 })
    })

    it('extracts coordinates from metadata lat/lng and latitude/longitude', () => {
      const offer1 = {
        city: 'Kraków',
        metadata: { lat: 50.06, lng: 19.94 },
      } as unknown as Offer
      expect(extractCoordinates(offer1)).toEqual({ lat: 50.06, lng: 19.94 })

      const offer2 = {
        city: 'Wrocław',
        metadata: { latitude: '51.1079', longitude: '17.0385' },
      } as unknown as Offer
      expect(extractCoordinates(offer2)).toEqual({ lat: 51.1079, lng: 17.0385 })
    })

    it('extracts coordinates from metadata.coordinates array and object', () => {
      const offerArray = {
        city: 'Gdańsk',
        metadata: { coordinates: [54.35, 18.65] },
      } as unknown as Offer
      expect(extractCoordinates(offerArray)).toEqual({ lat: 54.35, lng: 18.65 })

      const offerObj = {
        city: 'Poznań',
        metadata: { coordinates: { lat: 52.41, lng: 16.93 } },
      } as unknown as Offer
      expect(extractCoordinates(offerObj)).toEqual({ lat: 52.41, lng: 16.93 })
    })

    it('returns null for invalid or out of range coordinates', () => {
      expect(extractCoordinates(null)).toBeNull()
      expect(extractCoordinates({ city: 'Test' } as unknown as Offer)).toBeNull()
      expect(
        extractCoordinates({
          city: 'Test',
          metadata: { lat: 100, lng: 20 },
        } as unknown as Offer)
      ).toBeNull()
      expect(
        extractCoordinates({
          city: 'Test',
          metadata: { lat: 'invalid', lng: 'bad' },
        } as unknown as Offer)
      ).toBeNull()
    })
  })

  describe('getStaticCoordinates', () => {
    it('resolves coordinates for known Polish cities', () => {
      const warsaw = getStaticCoordinates('Warszawa')
      expect(warsaw).not.toBeNull()
      expect(warsaw?.lat).toBeCloseTo(52.2297, 1)
      expect(warsaw?.lng).toBeCloseTo(21.0122, 1)

      const krakow = getStaticCoordinates('Kraków')
      expect(krakow).not.toBeNull()
      expect(krakow?.lat).toBeCloseTo(50.0647, 1)

      const wroclaw = getStaticCoordinates('wrocław')
      expect(wroclaw).not.toBeNull()
      expect(wroclaw?.lat).toBeCloseTo(51.1079, 1)
    })

    it('resolves district-specific coordinates when available', () => {
      const mokotow = getStaticCoordinates('Warszawa', 'Mokotów')
      expect(mokotow).not.toBeNull()
      expect(mokotow?.lat).toBeCloseTo(52.1939, 1)
    })

    it('returns null for unknown locations', () => {
      expect(getStaticCoordinates('Atlantis')).toBeNull()
      expect(getStaticCoordinates('')).toBeNull()
      expect(getStaticCoordinates(undefined)).toBeNull()
    })
  })

  describe('geocodeWithNominatim', () => {
    it('fetches coordinates from Nominatim API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: '52.2297', lon: '21.0122', display_name: 'Warszawa, Polska' }],
      })

      const coords = await geocodeWithNominatim('Marszałkowska, Warszawa', mockFetch as unknown as typeof fetch)
      expect(coords).toEqual({ lat: 52.2297, lng: 21.0122 })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('uses memory cache on repeated queries', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: '50.0647', lon: '19.9450' }],
      })

      const query = 'Floriańska, Kraków'
      const first = await geocodeWithNominatim(query, mockFetch as unknown as typeof fetch)
      const second = await geocodeWithNominatim(query, mockFetch as unknown as typeof fetch)

      expect(first).toEqual({ lat: 50.0647, lng: 19.9450 })
      expect(second).toEqual({ lat: 50.0647, lng: 19.9450 })
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('handles empty results and network errors gracefully', async () => {
      const emptyFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
      const emptyResult = await geocodeWithNominatim('NonexistentPlaceXYZ', emptyFetch as unknown as typeof fetch)
      expect(emptyResult).toBeNull()

      const failingFetch = vi.fn().mockRejectedValue(new Error('Network offline'))
      const failedResult = await geocodeWithNominatim('Anywhere', failingFetch as unknown as typeof fetch)
      expect(failedResult).toBeNull()
    })
  })

  describe('resolveOfferCoordinates', () => {
    it('prioritizes explicit listing coordinates', async () => {
      const offer = {
        city: 'Warszawa',
        metadata: { lat: 52.25, lng: 21.05 },
      } as unknown as Offer

      const result = await resolveOfferCoordinates(offer)
      expect(result).toEqual({ lat: 52.25, lng: 21.05 })
    })

    it('falls back to static city coordinates when no direct coordinates exist', async () => {
      const offer = {
        city: 'Poznań',
      } as unknown as Offer

      const result = await resolveOfferCoordinates(offer, { allowGeocode: false })
      expect(result).not.toBeNull()
      expect(result?.lat).toBeCloseTo(52.4064, 1)
      expect(result?.lng).toBeCloseTo(16.9252, 1)
    })

    it('falls back to Poland center when city unknown and geocoding fails', async () => {
      const offer = {
        city: 'NieznanaWioskaXYZ',
      } as unknown as Offer

      const failingFetch = vi.fn().mockRejectedValue(new Error('error'))
      const result = await resolveOfferCoordinates(offer, {
        fetchFn: failingFetch as unknown as typeof fetch,
      })
      expect(result).toEqual(POLAND_CENTER_COORDINATES)
    })

    it('resolves real sample mock offers accurately', async () => {
      const offerWithDirect = {
        city: 'Warszawa',
        district: 'Mokotów',
        latitude: 52.2033,
        longitude: 21.0205,
      } as Offer
      const directResult = await resolveOfferCoordinates(offerWithDirect)
      expect(directResult).toEqual({ lat: 52.2033, lng: 21.0205 })

      const offerWithMeta = {
        city: 'Wrocław',
        metadata: { latitude: 51.1165, longitude: 17.0250 },
      } as unknown as Offer
      const metaResult = await resolveOfferCoordinates(offerWithMeta)
      expect(metaResult).toEqual({ lat: 51.1165, lng: 17.0250 })

      const offerWithStaticFallback = {
        city: 'Gdańsk',
        district: 'Przymorze',
      } as Offer
      const staticResult = await resolveOfferCoordinates(offerWithStaticFallback, { allowGeocode: false })
      expect(staticResult.lat).toBeCloseTo(54.4102, 1)
      expect(staticResult.lng).toBeCloseTo(18.5912, 1)
    })

    it('extracts district and street from title to resolve precise coordinates', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: '52.2356', lon: '20.9123' }],
      })

      const offerWithTitleLocation = {
        title: 'Mieszkanie na sprzedaż, 69 m² Bemowo, Anieli Krzywoń',
        city: 'Warszawa',
      } as Offer

      const result = await resolveOfferCoordinates(offerWithTitleLocation, {
        fetchFn: mockFetch as unknown as typeof fetch,
      })

      expect(result).toEqual({ lat: 52.2356, lng: 20.9123 })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Anieli%20Krzywo%C5%84'),
        expect.anything()
      )
    })

    it('falls back to parsed district static coordinates when geocoding fails', async () => {
      const failingFetch = vi.fn().mockRejectedValue(new Error('fail'))
      const offer = {
        title: '2 pokoje Warszawa Bemowo ul. Powstańców Śląskich',
        city: 'Warszawa',
      } as Offer

      const result = await resolveOfferCoordinates(offer, {
        fetchFn: failingFetch as unknown as typeof fetch,
      })

      // Should resolve to Bemowo coordinates (52.2514, 20.9084) rather than Warsaw downtown (52.2297, 21.0122)
      expect(result.lat).toBeCloseTo(52.2514, 1)
      expect(result.lng).toBeCloseTo(20.9084, 1)
    })
  })

  describe('extractLocationFromTitle & getEffectiveLocation', () => {
    it('parses district and street from title patterns', () => {
      const loc1 = extractLocationFromTitle('Mieszkanie na sprzedaż, 69 m² Bemowo, Anieli Krzywoń', 'Warszawa')
      expect(loc1.district).toBe('Bemowo')
      expect(loc1.street).toBe('Anieli Krzywoń')

      const loc2 = extractLocationFromTitle('Mieszkanie 3 pokoje Mokotów ul. Puławska', 'Warszawa')
      expect(loc2.district).toBe('Mokotów')
      expect(loc2.street).toBe('Puławska')

      const loc3 = extractLocationFromTitle('Kraków Dębniki, Tyniecka dom wolnostojący', 'Kraków')
      expect(loc3.district).toBe('Dębniki')
      expect(loc3.street).toBe('Tyniecka')
    })

    it('assembles effective location with district and street fallbacks', () => {
      const offer = {
        title: 'Mieszkanie na sprzedaż, 69 m² Bemowo, Anieli Krzywoń',
        city: 'Warszawa',
      } as Offer

      const effective = getEffectiveLocation(offer)
      expect(effective.city).toBe('Warszawa')
      expect(effective.district).toBe('Bemowo')
      expect(effective.street).toBe('Anieli Krzywoń')
    })
  })
})
