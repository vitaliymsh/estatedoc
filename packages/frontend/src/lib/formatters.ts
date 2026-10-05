import type { Language } from './i18n'

export const IGNORED_METADATA_KEYS = new Set([
  'street',
  'district',
  'city',
  'province',
  'currency',
  'postedAt',
  'price',
  'pricePerSqm',
  'areaSqm',
  'roomsCount',
  'floor',
  'totalFloors',
  'propertyType',
  'transactionType',
  'sellerType',
  'images',
  'imageUrl',
  'description',
  'title',
  'url',
  'portal',
  'externalId',
  'sourceUrl',
  'coordinates',
  'buildingType',
  'marketType',
  'hasElevator',
  'hasBalcony',
  'hasParking',
  'hasGarden',
  'hasTerrace',
  'hasBasement',
  'hasAirConditioning',
  'isFurnished',
  'yearBuilt',
  'tags',
  'airQuality',
  'noiseLevel',
  'lat',
  'lng',
  'latitude',
  'longitude',
])

const NUMBER_FORMATTERS: Record<Language, Intl.NumberFormat> = {
  pl: new Intl.NumberFormat('pl-PL'),
  en: new Intl.NumberFormat('en-US'),
}

export function formatPrice(
  price: number | null | undefined,
  lang: Language = 'pl',
  transactionType?: string | null
): string {
  if (price === null || price === undefined || price <= 0 || isNaN(price)) {
    return lang === 'en' ? 'Price negotiable' : 'Cena do negocjacji'
  }
  const isRent = transactionType?.toLowerCase() === 'rent'
  const currency = lang === 'en' ? (isRent ? 'PLN/mo' : 'PLN') : (isRent ? 'zł/mc' : 'zł')
  const formatter = NUMBER_FORMATTERS[lang] ?? NUMBER_FORMATTERS.pl
  const formattedNum = formatter.format(price)
  return `${formattedNum} ${currency}`
}

export function formatPricePerSqm(
  val: number | null | undefined,
  lang: Language = 'pl'
): string | null {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return null
  const unit = lang === 'en' ? 'PLN/m²' : 'zł/m²'
  const formatter = NUMBER_FORMATTERS[lang] ?? NUMBER_FORMATTERS.pl
  return `${formatter.format(Math.round(val))} ${unit}`
}

export function formatArea(areaSqm: number | null | undefined): string | null {
  if (areaSqm === null || areaSqm === undefined || isNaN(areaSqm) || areaSqm <= 0) return null
  const formatted = areaSqm % 1 === 0 ? String(areaSqm) : String(parseFloat(areaSqm.toFixed(2)))
  return `${formatted} m²`
}

export function formatRooms(
  roomsCount: number | null | undefined,
  lang: Language = 'pl'
): string | null {
  if (roomsCount === null || roomsCount === undefined || isNaN(roomsCount)) return null
  if (roomsCount === 0) {
    return lang === 'en' ? 'Studio' : 'Kawalerka'
  }
  if (roomsCount === 1) {
    return lang === 'en' ? '1 room' : '1 pokój'
  }
  if (lang === 'en') {
    return `${roomsCount} rooms`
  }
  if (roomsCount >= 2 && roomsCount <= 4) {
    return `${roomsCount} pokoje`
  }
  return `${roomsCount} pokoi`
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

const SELLER_LABELS: Record<string, { pl: string; en: string }> = {
  private: { pl: 'Prywatne', en: 'Private' },
  agency: { pl: 'Biuro', en: 'Agency' },
  company: { pl: 'Biuro', en: 'Agency' },
  developer: { pl: 'Deweloper', en: 'Developer' },
  verified: { pl: 'Zweryfikowany', en: 'Verified' },
}

export function formatSellerType(sellerType: string | null | undefined, lang: Language = 'pl'): string | null {
  if (!sellerType) return null
  return SELLER_LABELS[sellerType]?.[lang] ?? sellerType
}

export interface FormattedPortal {
  name: string
  badgeClassName: string
  dotColor: string
}

const PORTAL_CONFIGS: Record<string, FormattedPortal> = {
  sprzedajemy: { name: 'Sprzedajemy.pl', badgeClassName: 'bg-amber-600/90 text-white border-amber-500/40 shadow-xs backdrop-blur-md', dotColor: 'bg-amber-500' },
  morizon: { name: 'Morizon.pl', badgeClassName: 'bg-sky-600/90 text-white border-sky-500/40 shadow-xs backdrop-blur-md', dotColor: 'bg-sky-500' },
  otodom: { name: 'Otodom', badgeClassName: 'bg-emerald-600/90 text-white border-emerald-500/40 shadow-xs backdrop-blur-md', dotColor: 'bg-emerald-500' },
  gratka: { name: 'Gratka', badgeClassName: 'bg-amber-600/90 text-white border-amber-500/40 shadow-xs backdrop-blur-md', dotColor: 'bg-amber-500' },
  olx: { name: 'OLX', badgeClassName: 'bg-indigo-600/90 text-white border-indigo-500/40 shadow-xs backdrop-blur-md', dotColor: 'bg-indigo-500' },
}

const PORTAL_KEYS = Object.keys(PORTAL_CONFIGS)

export function formatPortal(portal: string | null | undefined): FormattedPortal {
  if (!portal) {
    return {
      name: 'Portal',
      badgeClassName: 'bg-neutral-800/90 text-white border-neutral-700/50 shadow-xs backdrop-blur-md',
      dotColor: 'bg-neutral-400',
    }
  }
  const lower = portal.toLowerCase().trim()
  const matchedKey = PORTAL_KEYS.find((key) => lower.includes(key))
  if (matchedKey) return PORTAL_CONFIGS[matchedKey]
  return {
    name: portal.charAt(0).toUpperCase() + portal.slice(1),
    badgeClassName: 'bg-primary/90 text-white border-primary/50 shadow-xs backdrop-blur-md',
    dotColor: 'bg-primary',
  }
}

const META_LABELS: Record<string, { pl: string; en: string; unit?: string }> = {
  plotSqm: { pl: 'Działka', en: 'Plot', unit: ' m²' },
  buildingType: { pl: 'Zabudowa', en: 'Building' },
  marketType: { pl: 'Rynek', en: 'Market' },
  yearBuilt: { pl: 'Rok budowy', en: 'Year built' },
  condition: { pl: 'Stan', en: 'Condition' },
  heating: { pl: 'Ogrzewanie', en: 'Heating' },
  ownership: { pl: 'Własność', en: 'Ownership' },
  agencyName: { pl: 'Agencja', en: 'Agency' },
}

export function formatMetadataValue(key: string, val: unknown, lang: Language = 'pl'): string {
  const meta = META_LABELS[key]
  if (meta) {
    return `${meta[lang]}: ${val}${meta.unit ?? ''}`
  }
  return `${key}: ${String(val)}`
}

const DATE_FORMATTER_EN = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const DATE_FORMATTER_PL = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function formatRelativeTime(dateString: string | null | undefined, lang: Language = 'pl'): string {
  if (!dateString) return lang === 'en' ? 'Recently added' : 'Niedawno dodane'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return lang === 'en' ? 'Recently added' : 'Niedawno dodane'

  const diffDays = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY)
  if (diffDays <= 0) return lang === 'en' ? 'Added today' : 'Dodano dzisiaj'
  if (diffDays === 1) return lang === 'en' ? 'Added yesterday' : 'Dodano wczoraj'
  if (diffDays < 7) return lang === 'en' ? `Added ${diffDays} days ago` : `Dodano ${diffDays} dni temu`
  if (diffDays < 14) return lang === 'en' ? 'Added 1 week ago' : 'Dodano tydzień temu'
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return lang === 'en' ? `Added ${weeks} weeks ago` : `Dodano ${weeks} tyg. temu`
  }
  return lang === 'en'
    ? `Added ${DATE_FORMATTER_EN.format(date)}`
    : `Dodano ${DATE_FORMATTER_PL.format(date)}`
}

export function buildGoogleMapsUrl(
  city: string,
  district?: string | null,
  street?: string | null
): string {
  const query = [street, district, city].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

const PROPERTY_TYPES: Record<string, { pl: string; en: string }> = {
  apartment: { pl: 'Mieszkanie', en: 'Apartment' },
  house: { pl: 'Dom', en: 'House' },
  land: { pl: 'Działka', en: 'Land' },
  commercial: { pl: 'Lokal użytkowy', en: 'Commercial' },
  garage: { pl: 'Garaż', en: 'Garage' },
}

export function formatPropertyType(type: string | null | undefined, lang: Language = 'pl'): string {
  if (!type) return lang === 'en' ? 'Property' : 'Nieruchomość'
  return PROPERTY_TYPES[type.toLowerCase()]?.[lang] ?? type
}

const TRANSACTION_TYPES: Record<string, { pl: string; en: string }> = {
  rent: { pl: 'na wynajem', en: 'for rent' },
  sale: { pl: 'na sprzedaż', en: 'for sale' },
}

export function formatTransactionType(type: string | null | undefined, lang: Language = 'pl'): string {
  if (!type) return lang === 'en' ? 'for sale' : 'na sprzedaż'
  return TRANSACTION_TYPES[type.toLowerCase()]?.[lang] ?? type
}

export function getOfferBadges(
  metadata: Record<string, unknown> | null | undefined,
  t: (key: any, params?: Record<string, string | number>) => string,
  lang: Language = 'pl'
): string[] {
  if (!metadata) return []
  const badges: string[] = []

  if (metadata.buildingType) badges.push(String(metadata.buildingType))
  if (metadata.plotSqm) badges.push(formatMetadataValue('plotSqm', metadata.plotSqm, lang))
  if (metadata.marketType === 'primary') badges.push(t('market_primary_full'))
  else if (metadata.marketType === 'secondary') badges.push(t('market_secondary_full'))

  if (metadata.hasElevator === true) badges.push(t('elevator'))
  if (metadata.hasBalcony === true || metadata.hasTerrace === true) badges.push(t('balcony_terrace'))
  if (metadata.hasParking === true) badges.push(t('parking_garage'))
  if (metadata.isFurnished === true) badges.push(t('furnished'))
  if (metadata.hasAirConditioning === true) badges.push(t('air_conditioning'))
  if (metadata.hasGarden === true) badges.push(lang === 'en' ? 'Garden' : 'Ogród')
  if (metadata.hasBasement === true) badges.push(t('basement_storage'))

  // ponytail: strict whitelist for card badges; detailed metadata rendered on OfferDetailPage
  return badges
}
