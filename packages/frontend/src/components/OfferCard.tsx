import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin } from 'lucide-react'
import type { Offer } from '../types/offer'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'
import { prefetchOffer } from '../lib/offer-prefetch'

interface OfferCardProps {
  offer: Offer
  onSelect?: (id: number) => void
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const [imgError, setImgError] = useState(false)
  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
  const imageUrl = !imgError
    ? offer.images?.[0] || offer.metadata?.imageUrl
    : undefined

  const district = offer.district || offer.metadata?.district
  const street = offer.street || (offer.metadata?.street as string | undefined)
  const sellerLabel = formatSellerType(
    offer.sellerType || (offer.metadata?.sellerType as string | undefined)
  )
  const floorText = formatFloor(offer.floor, offer.totalFloors)

  const metadataEntries = offer.metadata
    ? Object.entries(offer.metadata).filter(
        ([key, val]) => !IGNORED_METADATA_KEYS.has(key) && val !== null && val !== undefined
      )
    : []

  const handleMouseEnter = () => {
    prefetchOffer(offer)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault()
      onSelect(offer.id)
    }
  }

  return (
    <a
      href={`?offerId=${offer.id}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onTouchStart={handleMouseEnter}
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
        {sellerLabel && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="outline"
              className="rounded-full border-none bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs backdrop-blur-md"
            >
              {sellerLabel}
            </Badge>
          </div>
        )}
      </div>

      {/* Details Body */}
      <div className="mt-3 flex flex-col gap-1 text-sm">
        {/* City, District, Street + Room Count */}
        <div className="flex items-center justify-between font-semibold">
          <span className="truncate text-foreground flex items-center gap-1">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {offer.city}
              {district ? `, ${district}` : ''}
              {street ? `, ul. ${street}` : ''}
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

        {/* Area & Floor */}
        {(offer.areaSqm || floorText) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {offer.areaSqm && <span>{offer.areaSqm} m²</span>}
            {offer.areaSqm && floorText && <span>•</span>}
            {floorText && <span>{floorText}</span>}
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
