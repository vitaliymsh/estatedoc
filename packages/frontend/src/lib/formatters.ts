import type { Language } from './i18n'

export function formatPrice(price: string | null, lang: Language = 'pl'): string {
  if (!price) return lang === 'en' ? 'Price negotiable' : 'Cena do negocjacji'
  const num = Number(price)
  const currency = lang === 'en' ? 'PLN' : 'zł'
  const locale = lang === 'en' ? 'en-US' : 'pl-PL'
  return isNaN(num) ? price : `${num.toLocaleString(locale)} ${currency}`
}

export function calculatePricePerSqm(
  price: string | null,
  areaSqm: string | null,
  lang: Language = 'pl'
): string | null {
  if (!price || !areaSqm) return null
  const p = Number(price)
  const a = Number(areaSqm)
  if (isNaN(p) || isNaN(a) || a <= 0) return null
  const unit = lang === 'en' ? 'PLN/m²' : 'zł/m²'
  const locale = lang === 'en' ? 'en-US' : 'pl-PL'
  return `${Math.round(p / a).toLocaleString(locale)} ${unit}`
}

export function formatFloor(
  floor: number | null | undefined,
  totalFloors: number | null | undefined,
  lang: Language = 'pl'
): string | null {
  if (floor === null || floor === undefined) {
    if (!totalFloors) return null
    return lang === 'en' ? `${totalFloors} floors` : `${totalFloors} pięter`
  }
  if (floor === 0) {
    const ground = lang === 'en' ? 'Ground floor' : 'Parter'
    return totalFloors ? `${ground}/${totalFloors}` : ground
  }
  const prefix = lang === 'en' ? 'Floor' : 'Piętro'
  return totalFloors ? `${prefix} ${floor}/${totalFloors}` : `${prefix} ${floor}`
}

export function formatSellerType(sellerType: string | null | undefined, lang: Language = 'pl'): string | null {
  if (!sellerType) return null
  if (sellerType === 'private') return lang === 'en' ? 'Private' : 'Prywatne'
  if (sellerType === 'agency' || sellerType === 'company') return lang === 'en' ? 'Agency' : 'Biuro'
  if (sellerType === 'developer') return lang === 'en' ? 'Developer' : 'Deweloper'
  if (sellerType === 'verified') return lang === 'en' ? 'Verified' : 'Zweryfikowany'
  return sellerType
}

export const IGNORED_METADATA_KEYS = new Set([
  'imageUrl',
  'images',
  'district',
  'street',
  'streetAddress',
  'locality',
  'availability',
  'postedAt',
  'sellerType',
  'floor',
  'totalFloors',
  'propertyType',
  'transactionType',
  'plotSqm',
  'buildingType',
  'buildingMaterial',
  'marketType',
  'yearBuilt',
  'condition',
  'heating',
  'ownership',
  'rentExtra',
  'deposit',
  'exclusiveOffer',
  'hasElevator',
  'hasBalcony',
  'hasParking',
  'hasBasement',
  'hasAirConditioning',
  'isFurnished',
  'isPetFriendly',
  'tags',
  'airQuality',
  'noiseLevel',
  'agencyName',
  'agencyPhone',
  'areaSqm',
  'roomsCount',
  'price',
  'currency',
  'category',
  'viewCount',
  'sourceId',
])

export function formatMetadataValue(key: string, val: unknown, lang: Language = 'pl'): string {
  if (key === 'plotSqm') return lang === 'en' ? `Plot: ${val} m²` : `Działka: ${val} m²`
  if (key === 'buildingType') return lang === 'en' ? `Building: ${val}` : `Zabudowa: ${val}`
  if (key === 'marketType') return lang === 'en' ? `Market: ${val}` : `Rynek: ${val}`
  if (key === 'yearBuilt') return lang === 'en' ? `Year built: ${val}` : `Rok budowy: ${val}`
  if (key === 'condition') return lang === 'en' ? `Condition: ${val}` : `Stan: ${val}`
  if (key === 'heating') return lang === 'en' ? `Heating: ${val}` : `Ogrzewanie: ${val}`
  if (key === 'ownership') return lang === 'en' ? `Ownership: ${val}` : `Własność: ${val}`
  if (key === 'agencyName') return lang === 'en' ? `Agency: ${val}` : `Agencja: ${val}`
  return `${key}: ${String(val)}`
}

export function formatRelativeTime(dateString: string | null | undefined, lang: Language = 'pl'): string {
  if (!dateString) return lang === 'en' ? 'Recently added' : 'Niedawno dodane'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return lang === 'en' ? 'Recently added' : 'Niedawno dodane'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (lang === 'en') {
    if (diffDays <= 0) return 'Added today'
    if (diffDays === 1) return 'Added yesterday'
    if (diffDays < 7) return `Added ${diffDays} days ago`
    if (diffDays < 14) return 'Added 1 week ago'
    if (diffDays < 30) return `Added ${Math.floor(diffDays / 7)} weeks ago`
    return `Added ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  if (diffDays <= 0) return 'Dodano dzisiaj'
  if (diffDays === 1) return 'Dodano wczoraj'
  if (diffDays < 7) return `Dodano ${diffDays} dni temu`
  if (diffDays < 14) return 'Dodano tydzień temu'
  if (diffDays < 30) return `Dodano ${Math.floor(diffDays / 7)} tyg. temu`
  return `Dodano ${date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export function buildGoogleMapsUrl(
  city: string,
  district?: string | null,
  street?: string | null
): string {
  const parts = [street, district, city].filter(Boolean)
  const query = parts.join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function formatPropertyType(type: string | null | undefined, lang: Language = 'pl'): string {
  if (!type) return lang === 'en' ? 'Property' : 'Nieruchomość'
  switch (type.toLowerCase()) {
    case 'apartment':
      return lang === 'en' ? 'Apartment' : 'Mieszkanie'
    case 'house':
      return lang === 'en' ? 'House' : 'Dom'
    case 'land':
      return lang === 'en' ? 'Land' : 'Działka'
    case 'commercial':
      return lang === 'en' ? 'Commercial' : 'Lokal użytkowy'
    case 'garage':
      return lang === 'en' ? 'Garage' : 'Garaż'
    default:
      return type
  }
}

export function formatTransactionType(type: string | null | undefined, lang: Language = 'pl'): string {
  if (!type) return lang === 'en' ? 'for sale' : 'na sprzedaż'
  switch (type.toLowerCase()) {
    case 'rent':
      return lang === 'en' ? 'for rent' : 'na wynajem'
    case 'sale':
      return lang === 'en' ? 'for sale' : 'na sprzedaż'
    default:
      return type
  }
}

export function normalizeOfferImages(images: unknown, metadataImageUrl?: unknown): string[] {
  if (Array.isArray(images)) {
    return images
      .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
      .map((img) => img.trim())
  }
  if (typeof images === 'string' && images.trim().length > 0) {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
          .map((img) => img.trim())
      }
      if (typeof parsed === 'string' && parsed.trim().length > 0) {
        return [parsed.trim()]
      }
    } catch {
      return [images.trim()]
    }
  }
  if (typeof metadataImageUrl === 'string' && metadataImageUrl.trim().length > 0) {
    return [metadataImageUrl.trim()]
  }
  return []
}

const SECTION_SPLIT_RE =
  /([.!?])\s*(BUDYNEK\/OSIEDLE|NIERUCHOMOŚĆ|OKOLICA|STANDARD|LOKALIZACJA|DODATKOWE INFORMACJE|ROZKŁAD POMIESZCZEŃ|STAN PRAWNY|KOMUNIKACJA)/gi
const LIST_BULLET_RE = /\s*-\s+/g

export function formatDescriptionText(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(SECTION_SPLIT_RE, '$1\n\n$2').replace(LIST_BULLET_RE, '\n• ').trim()
}



