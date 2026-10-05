import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin } from 'lucide-react'
import type { Offer, OffersResponse } from './types/offer'
import { SAMPLE_OFFERS } from './mocks/offers'

function formatPrice(price: string | null): string {
  if (!price) return 'Cena do negocjacji'
  const num = Number(price)
  return isNaN(num) ? price : `${num.toLocaleString('pl-PL')} zł`
}

function calculatePricePerSqm(price: string | null, areaSqm: string | null): string | null {
  if (!price || !areaSqm) return null
  const p = Number(price)
  const a = Number(areaSqm)
  if (isNaN(p) || isNaN(a) || a <= 0) return null
  return `${Math.round(p / a).toLocaleString('pl-PL')} zł/m²`
}

function formatMetadataValue(key: string, val: unknown): string {
  if (key === 'plotSqm') return `Działka: ${val} m²`
  if (key === 'buildingType') return `Zabudowa: ${val}`
  return `${key}: ${String(val)}`
}

export default function App() {
  const [offers, setOffers] = useState<Offer[]>(SAMPLE_OFFERS)

  useEffect(() => {
    fetch('/api/offers?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OffersResponse | null) => {
        if (data?.items && data.items.length > 0) {
          setOffers(data.items)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight">EstatePlanner</h1>
          <p className="text-sm text-muted-foreground">
            {offers.length} {offers.length === 1 ? 'oferta' : 'ofert'}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer) => {
            const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
            const metadataEntries = offer.metadata ? Object.entries(offer.metadata) : []

            return (
              <a
                key={offer.id}
                href={offer.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col cursor-pointer no-underline text-inherit"
              >
                {/* Visual Media Header */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center border">
                  <Building2 className="size-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />

                  {/* Portal Badge Top Left */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur-md dark:bg-black/80 dark:text-neutral-100">
                      {offer.portal}
                    </span>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  {/* City & Room Count */}
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate text-foreground flex items-center gap-1">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      {offer.city}
                    </span>
                    {offer.roomsCount && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {offer.roomsCount} pok.
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="line-clamp-1 text-muted-foreground text-xs font-normal">
                    {offer.title}
                  </p>

                  {/* Area */}
                  {offer.areaSqm && (
                    <div className="text-xs text-muted-foreground">
                      <span>{offer.areaSqm} m²</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-semibold text-foreground underline decoration-1 underline-offset-2">
                      {formatPrice(offer.price)}
                    </span>
                    {pricePerSqm && (
                      <span className="text-xs text-muted-foreground">({pricePerSqm})</span>
                    )}
                  </div>

                  {/* Dynamic Extra Metadata Tags */}
                  {metadataEntries.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {metadataEntries.map(([key, val]) => (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground"
                        >
                          {formatMetadataValue(key, val)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
