import type { Language } from './i18n'

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
  const locale = lang === 'en' ? 'en-US' : 'pl-PL'
  const formattedNum = price.toLocaleString(locale)
  return `${formattedNum} ${currency}`
}

export function formatPricePerSqm(
  val: number | null | undefined,
  lang: Language = 'pl'
): string | null {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return null
  const unit = lang === 'en' ? 'PLN/m²' : 'zł/m²'
  const locale = lang === 'en' ? 'en-US' : 'pl-PL'
  return `${Math.round(val).toLocaleString(locale)} ${unit}`
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

export function formatSellerType(sellerType: string | null | undefined, lang: Language = 'pl'): string | null {
  if (!sellerType) return null
  if (sellerType === 'private') return lang === 'en' ? 'Private' : 'Prywatne'
  if (sellerType === 'agency' || sellerType === 'company') return lang === 'en' ? 'Agency' : 'Biuro'
  if (sellerType === 'developer') return lang === 'en' ? 'Developer' : 'Deweloper'
  if (sellerType === 'verified') return lang === 'en' ? 'Verified' : 'Zweryfikowany'
  return sellerType
}

export interface FormattedPortal {
  name: string
  badgeClassName: string
  dotColor: string
}

export function formatPortal(portal: string | null | undefined): FormattedPortal {
  if (!portal) {
    return {
      name: 'Portal',
      badgeClassName: 'bg-neutral-800/90 text-white border-neutral-700/50 shadow-xs backdrop-blur-md',
      dotColor: 'bg-neutral-400',
    }
  }
  const lower = portal.toLowerCase().trim()
  if (lower.includes('sprzedajemy')) {
    return {
      name: 'Sprzedajemy.pl',
      badgeClassName: 'bg-amber-600/90 text-white border-amber-500/40 shadow-xs backdrop-blur-md',
      dotColor: 'bg-amber-500',
    }
  }
  if (lower.includes('morizon')) {
    return {
      name: 'Morizon.pl',
      badgeClassName: 'bg-sky-600/90 text-white border-sky-500/40 shadow-xs backdrop-blur-md',
      dotColor: 'bg-sky-500',
    }
  }
  if (lower.includes('otodom')) {
    return {
      name: 'Otodom',
      badgeClassName: 'bg-emerald-600/90 text-white border-emerald-500/40 shadow-xs backdrop-blur-md',
      dotColor: 'bg-emerald-500',
    }
  }
  if (lower.includes('olx')) {
    return {
      name: 'OLX',
      badgeClassName: 'bg-indigo-600/90 text-white border-indigo-500/40 shadow-xs backdrop-blur-md',
      dotColor: 'bg-indigo-500',
    }
  }
  return {
    name: portal.charAt(0).toUpperCase() + portal.slice(1),
    badgeClassName: 'bg-primary/90 text-white border-primary/50 shadow-xs backdrop-blur-md',
    dotColor: 'bg-primary',
  }
}

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
