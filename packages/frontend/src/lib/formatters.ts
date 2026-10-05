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

export const IGNORED_METADATA_KEYS = new Set([
  'imageUrl',
  'district',
  'postedAt',
  'sellerType',
])

export function formatMetadataValue(key: string, val: unknown): string {
  if (key === 'plotSqm') return `Działka: ${val} m²`
  if (key === 'buildingType') return `Zabudowa: ${val}`
  if (key === 'sellerType') {
    if (val === 'private') return 'Prywatna'
    if (val === 'company') return 'Biuro'
    if (val === 'verified') return 'Zweryfikowany'
  }
  return `${key}: ${String(val)}`
}
