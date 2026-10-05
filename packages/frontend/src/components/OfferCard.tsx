import { useState, lazy, Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Building2, MapPin, Map } from 'lucide-react'
import type { Offer } from '../types/offer'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  normalizeOfferImages,
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'
import { prefetchOffer } from '../lib/offer-prefetch'

const ListingMap = lazy(() =>
  import('./ListingMap').then((m) => ({ default: m.ListingMap }))
)

interface OfferCardProps {
  offer: Offer
  onSelect?: (id: number) => void
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const [imgError, setImgError] = useState(false)
  const [showMapPreview, setShowMapPreview] = useState(false)
  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
  const normalizedImages = normalizeOfferImages(offer.images, offer.metadata?.imageUrl)
  const imageUrl = !imgError && normalizedImages.length > 0 ? normalizedImages[0] : undefined

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
      {/* Visual Card Image / Map Banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center border">
        {showMapPreview ? (
          <div className="h-full w-full pointer-events-none">
            <Suspense fallback={<div className="h-full w-full bg-muted/40 animate-pulse" />}>
              <ListingMap
                offer={offer}
                height="100%"
                interactive={false}
                showControls={false}
                showPopup={false}
                zoom={13}
              />
            </Suspense>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <Building2 className="size-12 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
        )}

        {/* Portal Badge Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant="outline"
            className="rounded-full border-none bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-900 shadow-xs backdrop-blur-md dark:bg-black/80 dark:text-neutral-100"
          >
            {offer.portal}
          </Badge>
        </div>

        {/* Top Right Badges & Map Toggle */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {sellerLabel && !showMapPreview ? (
            <Badge
              variant="outline"
              className="rounded-full border-none bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs backdrop-blur-md"
            >
              {sellerLabel}
            </Badge>
          ) : null}

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMapPreview((prev) => !prev)
                  }}
                  aria-label={showMapPreview ? 'Pokaż zdjęcia' : 'Podgląd na mapie'}
                  className="rounded-full bg-background/90 p-1.5 text-foreground shadow-xs backdrop-blur-md transition hover:scale-110 hover:bg-background cursor-pointer"
                />
              }
            >
              {showMapPreview ? <Building2 className="size-3.5" /> : <Map className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent>
              {showMapPreview ? 'Pokaż zdjęcia' : 'Podgląd na mapie'}
            </TooltipContent>
          </Tooltip>
        </div>
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
          {offer.roomsCount != null && offer.roomsCount > 0 ? (
            <span className="shrink-0 text-xs font-medium text-muted-foreground ml-2">
              {offer.roomsCount} pok.
            </span>
          ) : null}
        </div>

        {/* Title */}
        <p className="line-clamp-1 text-muted-foreground text-xs font-normal">
          {offer.title}
        </p>

        {/* Area & Floor */}
        {offer.areaSqm || floorText ? (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {offer.areaSqm ? <span>{offer.areaSqm} m²</span> : null}
            {offer.areaSqm && floorText ? <span>•</span> : null}
            {floorText ? <span>{floorText}</span> : null}
          </div>
        ) : null}

        {/* Price */}
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-semibold text-foreground underline decoration-1 underline-offset-2">
            {formatPrice(offer.price)}
          </span>
          {pricePerSqm ? (
            <span className="text-xs text-muted-foreground">({pricePerSqm})</span>
          ) : null}
        </div>

        {/* Quick Feature Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {offer.metadata?.buildingType && (
            <Badge variant="secondary" className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground capitalize">
              {String(offer.metadata.buildingType)}
            </Badge>
          )}
          {offer.metadata?.hasElevator && (
            <Badge variant="secondary" className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground">
              Winda
            </Badge>
          )}
          {offer.metadata?.hasBalcony && (
            <Badge variant="secondary" className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground">
              Balkon
            </Badge>
          )}
          {offer.metadata?.hasParking && (
            <Badge variant="secondary" className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground">
              Parking
            </Badge>
          )}
          {metadataEntries.slice(0, 2).map(([key, val]) => (
            <Badge
              key={key}
              variant="secondary"
              className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground"
            >
              {formatMetadataValue(key, val)}
            </Badge>
          ))}
        </div>
      </div>
    </a>
  )
}

