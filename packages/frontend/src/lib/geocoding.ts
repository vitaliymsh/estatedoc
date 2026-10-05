import type { Offer } from '../types/offer'

export interface Coordinates {
  lat: number
  lng: number
}

export const POLAND_CENTER_COORDINATES: Coordinates = {
  lat: 52.0693,
  lng: 19.4803,
}

// In-memory cache to prevent redundant Nominatim requests
const geocodeCache = new Map<string, Coordinates | null>()

export function clearGeocodeCache(): void {
  geocodeCache.clear()
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Static coordinate lookup for major Polish cities and key districts
const STATIC_CITIES: Record<string, Coordinates> = {
  warszawa: { lat: 52.2297, lng: 21.0122 },
  krakow: { lat: 50.0647, lng: 19.9450 },
  wroclaw: { lat: 51.1079, lng: 17.0385 },
  lodz: { lat: 51.7592, lng: 19.4560 },
  poznan: { lat: 52.4064, lng: 16.9252 },
  gdansk: { lat: 54.3520, lng: 18.6466 },
  szczecin: { lat: 53.4285, lng: 14.5528 },
  bydgoszcz: { lat: 53.1235, lng: 18.0084 },
  lublin: { lat: 51.2465, lng: 22.5684 },
  katowice: { lat: 50.2649, lng: 19.0238 },
  gdynia: { lat: 54.5189, lng: 18.5305 },
  sopot: { lat: 54.4418, lng: 18.5601 },
  bialystok: { lat: 53.1325, lng: 23.1688 },
  czestochowa: { lat: 50.8118, lng: 19.1203 },
  radom: { lat: 51.4027, lng: 21.1471 },
  torun: { lat: 53.0138, lng: 18.5984 },
  sosnowiec: { lat: 50.2863, lng: 19.1041 },
  rzeszow: { lat: 50.0412, lng: 21.9991 },
  kielce: { lat: 50.8661, lng: 20.6286 },
  gliwice: { lat: 50.2945, lng: 18.6714 },
  zabrze: { lat: 50.3249, lng: 18.7857 },
  olsztyn: { lat: 53.7784, lng: 20.4801 },
  bielskobiala: { lat: 49.8225, lng: 19.0444 },
  bytom: { lat: 50.3480, lng: 18.9157 },
  zielonagora: { lat: 51.9356, lng: 15.5062 },
  rybnik: { lat: 50.0971, lng: 18.5418 },
  rudaslaska: { lat: 50.2584, lng: 18.8558 },
  opole: { lat: 50.6751, lng: 17.9213 },
  tychy: { lat: 50.1231, lng: 18.9868 },
  gorzowwielkopolski: { lat: 52.7368, lng: 15.2288 },
  dabrowagornicza: { lat: 50.3204, lng: 19.1944 },
  plock: { lat: 52.5463, lng: 19.7065 },
  elblag: { lat: 54.1561, lng: 19.4045 },
  walbrzych: { lat: 50.7813, lng: 16.2847 },
  wloclawek: { lat: 52.6483, lng: 19.0678 },
  tarnow: { lat: 50.0121, lng: 20.9858 },
  chorzow: { lat: 50.2975, lng: 18.9546 },
  koszalin: { lat: 54.1944, lng: 16.1722 },
  kalisz: { lat: 51.7673, lng: 18.0853 },
  legnica: { lat: 51.2070, lng: 16.1553 },
}

const STATIC_DISTRICTS: Record<string, Coordinates> = {
  'warszawa:mokotow': { lat: 52.1939, lng: 21.0315 },
  'warszawa:srodmiescie': { lat: 52.2319, lng: 21.0067 },
  'warszawa:wola': { lat: 52.2367, lng: 20.9634 },
  'warszawa:ursynow': { lat: 52.1415, lng: 21.0336 },
  'warszawa:ochota': { lat: 52.2155, lng: 20.9785 },
  'warszawa:zoliborz': { lat: 52.2685, lng: 20.9788 },
  'warszawa:bielany': { lat: 52.2858, lng: 20.9388 },
  'warszawa:bemowo': { lat: 52.2514, lng: 20.9084 },
  'warszawa:pragapoludnie': { lat: 52.2372, lng: 21.0772 },
  'warszawa:pragapolnoc': { lat: 52.2592, lng: 21.0336 },
  'krakow:staremiasto': { lat: 50.0619, lng: 19.9373 },
  'krakow:debnik': { lat: 50.0384, lng: 19.9022 },
  'krakow:debniki': { lat: 50.0384, lng: 19.9022 },
  'krakow:kazimierz': { lat: 50.0519, lng: 19.9442 },
  'krakow:podgorze': { lat: 50.0354, lng: 19.9575 },
  'krakow:nowahuta': { lat: 50.0722, lng: 20.0375 },
  'krakow:krowodrza': { lat: 50.0743, lng: 19.9192 },
  'wroclaw:staremiasto': { lat: 51.1097, lng: 17.0317 },
  'wroclaw:srodmiescie': { lat: 51.1189, lng: 17.0543 },
  'wroclaw:krzyki': { lat: 51.0825, lng: 17.0145 },
  'wroclaw:kepamieszczanska': { lat: 51.1158, lng: 17.0232 },
  'gdansk:przymorze': { lat: 54.4102, lng: 18.5912 },
  'gdansk:wrzeszcz': { lat: 54.3804, lng: 18.6015 },
  'gdansk:oliwa': { lat: 54.4082, lng: 18.5583 },
  'poznan:winogrady': { lat: 52.4331, lng: 16.9298 },
  'poznan:jezyce': { lat: 52.4172, lng: 16.9038 },
  'poznan:grunwald': { lat: 52.3925, lng: 16.8833 },
  'lodz:srodmiescie': { lat: 51.7675, lng: 19.4586 },
  'lodz:ksiezymlyn': { lat: 51.7533, lng: 19.4831 },
}

function parseNumber(val: unknown): number | null {
  if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
    return val
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number.parseFloat(val)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)
}

/**
 * Extracts coordinates from an Offer object or its metadata payload.
 */
export function extractCoordinates(offer: Partial<Offer> | null | undefined): Coordinates | null {
  if (!offer) return null

  // 1. Direct fields on Offer
  const offerAny = offer as Record<string, unknown>
  const directLat = parseNumber(offerAny.latitude ?? offerAny.lat)
  const directLng = parseNumber(offerAny.longitude ?? offerAny.lng)
  if (directLat !== null && directLng !== null && isValidCoordinates(directLat, directLng)) {
    return { lat: directLat, lng: directLng }
  }

  // 2. Metadata properties
  const meta = offer.metadata
  if (meta && typeof meta === 'object') {
    const metaLat = parseNumber(meta.lat ?? meta.latitude)
    const metaLng = parseNumber(meta.lng ?? meta.longitude ?? meta.lon)
    if (metaLat !== null && metaLng !== null && isValidCoordinates(metaLat, metaLng)) {
      return { lat: metaLat, lng: metaLng }
    }

    // Coordinates array or object in metadata
    const coords = meta.coordinates ?? meta.location ?? meta.geo
    if (coords && typeof coords === 'object') {
      if (Array.isArray(coords) && coords.length >= 2) {
        const c0 = parseNumber(coords[0])
        const c1 = parseNumber(coords[1])
        if (c0 !== null && c1 !== null && isValidCoordinates(c0, c1)) {
          return { lat: c0, lng: c1 }
        }
      } else {
        const cObj = coords as Record<string, unknown>
        const cLat = parseNumber(cObj.lat ?? cObj.latitude)
        const cLng = parseNumber(cObj.lng ?? cObj.longitude ?? cObj.lon)
        if (cLat !== null && cLng !== null && isValidCoordinates(cLat, cLng)) {
          return { lat: cLat, lng: cLng }
        }
      }
    }
  }

  return null
}

/**
 * Looks up coordinates in the static cache using city and optional district.
 */
export function getStaticCoordinates(
  city?: string | null,
  district?: string | null
): Coordinates | null {
  if (!city) return null
  const normCity = normalizeKey(city)

  if (district) {
    const normDistrict = normalizeKey(district)
    const districtKey = `${normCity}:${normDistrict}`
    if (STATIC_DISTRICTS[districtKey]) {
      return STATIC_DISTRICTS[districtKey]
    }
  }

  if (STATIC_CITIES[normCity]) {
    return STATIC_CITIES[normCity]
  }

  return null
}

/**
 * Lightweight geocoding fallback via OpenStreetMap Nominatim with memory caching.
 */
export async function geocodeWithNominatim(
  query: string,
  fetchFn: typeof fetch = fetch
): Promise<Coordinates | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const cacheKey = normalizeKey(trimmed)
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`
    const res = await fetchFn(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Docplanner-RealEstate-Frontend/1.0',
      },
    })

    if (!res.ok) {
      geocodeCache.set(cacheKey, null)
      return null
    }

    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseNumber(data[0]?.lat)
      const lng = parseNumber(data[0]?.lon)
      if (lat !== null && lng !== null && isValidCoordinates(lat, lng)) {
        const coords: Coordinates = { lat, lng }
        geocodeCache.set(cacheKey, coords)
        return coords
      }
    }

    geocodeCache.set(cacheKey, null)
    return null
  } catch {
    // Gracefully handle network errors
    // ponytail: memory cache avoids repeated failing requests during session
    geocodeCache.set(cacheKey, null)
    return null
  }
}

const KNOWN_DISTRICTS_BY_CITY: Record<string, string[]> = {
  warszawa: [
    'Mokotów',
    'Śródmieście',
    'Wola',
    'Ursynów',
    'Bielany',
    'Bemowo',
    'Żoliborz',
    'Ochota',
    'Wilanów',
    'Włochy',
    'Białołęka',
    'Wawer',
    'Rembertów',
    'Wesoła',
    'Ursus',
    'Targówek',
    'Praga-Południe',
    'Praga-Północ',
    'Praga Południe',
    'Praga Północ',
  ],
  krakow: [
    'Stare Miasto',
    'Dębniki',
    'Kazimierz',
    'Podgórze',
    'Krowodrza',
    'Nowa Huta',
    'Bronowice',
    'Grzegórzki',
    'Prądnik Czerwony',
    'Prądnik Biały',
    'Łagiewniki',
    'Czyżyny',
    'Mistrzejowice',
  ],
  wroclaw: [
    'Stare Miasto',
    'Śródmieście',
    'Krzyki',
    'Fabryczna',
    'Psie Pole',
    'Kępa Mieszczańska',
    'Biskupin',
    'Sępolno',
  ],
  gdansk: [
    'Przymorze',
    'Wrzeszcz',
    'Oliwa',
    'Zaspa',
    'Jelitkowo',
    'Śródmieście',
    'Morena',
    'Chełm',
  ],
  poznan: [
    'Winogrady',
    'Jeżyce',
    'Grunwald',
    'Wilda',
    'Rataje',
    'Stare Miasto',
    'Nowe Miasto',
  ],
  lodz: [
    'Śródmieście',
    'Bałuty',
    'Polesie',
    'Widzew',
    'Górna',
    'Księży Młyn',
    'Retkinia',
  ],
}

const DISTRICT_PATTERNS_BY_CITY: Record<string, { name: string; re: RegExp }[]> =
  Object.fromEntries(
    Object.entries(KNOWN_DISTRICTS_BY_CITY).map(([city, districts]) => [
      city,
      districts.map((d) => ({ name: d, re: new RegExp(`\\b${d}\\b`, 'i') })),
    ])
  )

const STREET_PREFIX_RE =
  /(?:ul\.|ulica|al\.|aleja)\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s-]+?)(?:,|\.|$|\s+(?:z|w|na|dla|blisko|przy|po|dom|mieszkanie)\b)/i

const TRAILING_ADDRESS_RE =
  /^[,-\s]+\s*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s-]+?)(?:,|\.|$|\s+(?:z|w|na|dla|blisko|przy|po|dom|mieszkanie)\b)/i

/**
 * Parses district and street names embedded in the listing title.
 */
export function extractLocationFromTitle(
  title?: string | null,
  city?: string | null
): { district?: string; street?: string } {
  if (!title) return {}
  const normCity = city ? normalizeKey(city) : 'warszawa'
  const cityDistricts = DISTRICT_PATTERNS_BY_CITY[normCity] || []

  let foundDistrict: string | undefined
  for (const item of cityDistricts) {
    if (item.re.test(title)) {
      foundDistrict = item.name
      break
    }
  }

  let foundStreet: string | undefined
  // 1. Explicit street prefix: ul. / ulica / al. / aleja
  const ulMatch = title.match(STREET_PREFIX_RE)
  if (ulMatch && ulMatch[1]) {
    foundStreet = ulMatch[1].trim()
  } else if (foundDistrict) {
    // 2. Trailing address pattern: "District, Street" or "District - Street"
    const districtPos = title.toLowerCase().indexOf(foundDistrict.toLowerCase())
    if (districtPos !== -1) {
      const remainder = title.slice(districtPos + foundDistrict.length).trim()
      const afterMatch = remainder.match(TRAILING_ADDRESS_RE)
      if (afterMatch && afterMatch[1]) {
        const candidate = afterMatch[1].trim()
        if (
          candidate.length > 2 &&
          !candidate.toLowerCase().includes('mieszkanie') &&
          !candidate.toLowerCase().includes('pokoj') &&
          !candidate.toLowerCase().includes('sprzedaz')
        ) {
          foundStreet = candidate
        }
      }
    }
  }

  return {
    district: foundDistrict,
    street: foundStreet,
  }
}

/**
 * Returns effective location combining direct fields, metadata and title parser.
 */
export function getEffectiveLocation(offer: Partial<Offer> | null | undefined): {
  city: string
  district?: string
  street?: string
} {
  if (!offer) return { city: 'Warszawa' }

  const city = offer.city || 'Warszawa'
  const parsed = extractLocationFromTitle(offer.title, city)

  const district =
    offer.district ||
    (offer.metadata?.district as string | undefined) ||
    parsed.district

  const street =
    offer.street ||
    (offer.metadata?.street as string | undefined) ||
    parsed.street

  return {
    city,
    district,
    street,
  }
}

export interface ResolveOptions {
  allowGeocode?: boolean
  fetchFn?: typeof fetch
}

/**
 * Full coordinate resolver pipeline:
 * 1. Metadata / listing direct coordinates
 * 2. Title-extracted & direct address hierarchy
 * 3. Nominatim geocoding
 * 4. Static district & city dictionary
 * 5. Poland center default
 */
export async function resolveOfferCoordinates(
  offer: Partial<Offer> | null | undefined,
  options: ResolveOptions = {}
): Promise<Coordinates> {
  if (!offer) return POLAND_CENTER_COORDINATES

  // 1. Direct coordinates
  const direct = extractCoordinates(offer)
  if (direct) return direct

  // 2. Effective address components
  const { city, district, street } = getEffectiveLocation(offer)
  const staticDistrictCoords = getStaticCoordinates(city, district)

  // 3. Online Geocoding (if allowed and address components available)
  if (options.allowGeocode !== false && city) {
    const addressParts = [street, district, city, 'Polska'].filter(Boolean)
    if (addressParts.length >= 2) {
      const query = addressParts.join(', ')
      const onlineCoords = await geocodeWithNominatim(query, options.fetchFn)
      if (onlineCoords) return onlineCoords
    }
  }

  // 4. Static district fallback
  if (staticDistrictCoords) return staticDistrictCoords

  // 5. Static city fallback
  const staticCityCoords = getStaticCoordinates(city, null)
  if (staticCityCoords) return staticCityCoords

  // 6. Default Poland center
  return POLAND_CENTER_COORDINATES
}
