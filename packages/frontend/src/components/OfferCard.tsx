import { Badge } from '@/components/ui/badge'
import { Building2, MapPin } from 'lucide-react'
import type { Offer } from '../types/offer'
import { formatPrice, calculatePricePerSqm, formatMetadataValue } from '../lib/formatters'

interface OfferCardProps {
  offer: Offer
}

export function OfferCard({ offer }: OfferCardProps) {
  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
  const metadataEntries = offer.metadata ? Object.entries(offer.metadata) : []

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col cursor-pointer no-underline text-inherit"
    >
      {/* Visual Card Image Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center border">
        <Building2 className="size-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />

        {/* Portal Badge Top Left */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-900 shadow-xs backdrop-blur-md dark:bg-black/80 dark:text-neutral-100">
            {offer.portal}
          </span>
        </div>
      </div>

      {/* Details Body */}
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
}
