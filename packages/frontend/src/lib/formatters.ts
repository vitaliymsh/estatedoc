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
