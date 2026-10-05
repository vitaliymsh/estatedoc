export function formatPrice(price: string | null): string {
  if (!price) return 'Cena do negocjacji'
  const num = Number(price)
  return isNaN(num) ? price : `${num.toLocaleString('pl-PL')} zł`
}

export function calculatePricePerSqm(price: string | null, areaSqm: string | null): string | null {
  if (!price || !areaSqm) return null
  const p = Number(price)
  const a = Number(areaSqm)
  if (isNaN(p) || isNaN(a) || a <= 0) return null
  return `${Math.round(p / a).toLocaleString('pl-PL')} zł/m²`
}

export function formatFloor(floor: number | null | undefined, totalFloors: number | null | undefined): string | null {
  if (floor === null || floor === undefined) {
    return totalFloors ? `${totalFloors} pięter` : null
  }
  if (floor === 0) {
    return totalFloors ? `Parter/${totalFloors}` : 'Parter'
  }
  return totalFloors ? `Piętro ${floor}/${totalFloors}` : `Piętro ${floor}`
}

export function formatSellerType(sellerType: string | null | undefined): string | null {
  if (!sellerType) return null
  if (sellerType === 'private') return 'Prywatne'
  if (sellerType === 'agency' || sellerType === 'company') return 'Biuro'
  if (sellerType === 'developer') return 'Deweloper'
  if (sellerType === 'verified') return 'Zweryfikowany'
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
  'marketType',
  'yearBuilt',
  'condition',
  'heating',
  'ownership',
  'agencyName',
  'agencyPhone',
  'areaSqm',
  'roomsCount',
  'price',
  'currency',
])

export function formatMetadataValue(key: string, val: unknown): string {
  if (key === 'plotSqm') return `Działka: ${val} m²`
  if (key === 'buildingType') return `Zabudowa: ${val}`
  if (key === 'marketType') return `Rynek: ${val}`
  if (key === 'yearBuilt') return `Rok budowy: ${val}`
  if (key === 'condition') return `Stan: ${val}`
  if (key === 'heating') return `Ogrzewanie: ${val}`
  if (key === 'ownership') return `Własność: ${val}`
  if (key === 'agencyName') return `Agencja: ${val}`
  return `${key}: ${String(val)}`
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Niedawno dodane'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Niedawno dodane'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

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

export function formatPropertyType(type: string | null | undefined): string {
  if (!type) return 'Nieruchomość'
  switch (type.toLowerCase()) {
    case 'apartment':
      return 'Mieszkanie'
    case 'house':
      return 'Dom'
    case 'land':
      return 'Działka'
    case 'commercial':
      return 'Lokal użytkowy'
    case 'garage':
      return 'Garaż'
    default:
      return type
  }
}

export function formatTransactionType(type: string | null | undefined): string {
  if (!type) return 'na sprzedaż'
  switch (type.toLowerCase()) {
    case 'rent':
      return 'na wynajem'
    case 'sale':
      return 'na sprzedaż'
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


