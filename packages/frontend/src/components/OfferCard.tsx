import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin } from 'lucide-react'
import type { Offer } from '../types/offer'
import {
  formatPrice,
  calculatePricePerSqm,
  formatMetadataValue,
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'

interface OfferCardProps {
  offer: Offer
}

export function OfferCard({ offer }: OfferCardProps) {
  const [imgError, setImgError] = useState(false)
  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
  const imageUrl = !imgError ? offer.metadata?.imageUrl : undefined

  const metadataEntries = offer.metadata
    ? Object.entries(offer.metadata).filter(
        ([key, val]) => !IGNORED_METADATA_KEYS.has(key) && val !== null && val !== undefined
      )
    : []

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col cursor-pointer no-underline text-inherit"
    >
      {/* Visual Card Image Banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center border">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Building2 className="size-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
        )}

        {/* Portal Badge Top Left */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className="rounded-full border-none bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-900 shadow-xs backdrop-blur-md dark:bg-black/80 dark:text-neutral-100"
          >
            {offer.portal}
          </Badge>
        </div>

        {/* Seller Type Badge Top Right */}
        {offer.metadata?.sellerType && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="rounded-full border-none bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs backdrop-blur-md"
            >
              {offer.metadata.sellerType === 'private' ? 'Prywatne' : 'Biuro'}
            </Badge>
          </div>
        )}
      </div>

      {/* Details Body */}
      <div className="mt-3 flex flex-col gap-1 text-sm">
        {/* City & District + Room Count */}
        <div className="flex items-center justify-between font-semibold">
          <span className="truncate text-foreground flex items-center gap-1">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {offer.city}
              {offer.metadata?.district ? `, ${offer.metadata.district}` : ''}
            </span>
          </span>
          {offer.roomsCount && (
            <span className="shrink-0 text-xs font-medium text-muted-foreground ml-2">
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
