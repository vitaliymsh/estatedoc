import { useState, lazy, Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Building2, MapPin, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Offer } from '../types/offer'
import {
  formatPrice,
  formatPricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  formatPortal,
  formatArea,
  formatRooms,
} from '../lib/formatters'
import { prefetchOffer } from '../lib/offer-prefetch'
import { useTranslation } from '@/lib/i18n'

const ListingMap = lazy(() =>
  import('./ListingMap').then((m) => ({ default: m.ListingMap }))
)

interface OfferCardProps {
  offer: Offer
  onSelect?: (id: number) => void
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const { t, lang } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const [showMapPreview, setShowMapPreview] = useState(false)
  const pricePerSqm = formatPricePerSqm(offer.pricePerSqm, lang)
  const imageUrl = !imgError && offer.images?.[0] ? offer.images[0] : undefined

  const district = offer.district
  const street = offer.street
  const sellerLabel = formatSellerType(offer.sellerType, lang)
  const floorText = formatFloor(offer.floor, offer.totalFloors, lang)
  const portalInfo = formatPortal(offer.portal)
  const areaText = formatArea(offer.areaSqm)
  const roomsText = formatRooms(offer.roomsCount, lang)

  const metadataEntries = offer.metadata
    ? Object.entries(offer.metadata).filter(
        ([, val]) => val !== null && val !== undefined
      )
    : []

  const badges: string[] = []
  if (offer.metadata?.buildingType) badges.push(String(offer.metadata.buildingType))
  if (offer.metadata?.hasElevator) badges.push(t('elevator'))
  if (offer.metadata?.hasBalcony) badges.push(t('balcony_terrace'))
  if (offer.metadata?.hasParking) badges.push(t('parking_garage'))
  for (const [key, val] of metadataEntries) {
    badges.push(formatMetadataValue(key, val, lang))
  }
  const visibleBadges = badges.slice(0, 3)
  const overflowCount = badges.length - visibleBadges.length

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
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs backdrop-blur-md border",
              portalInfo.badgeClassName
            )}
          >
            {portalInfo.name}
          </Badge>
        </div>

        {/* Top Right Badges & Desktop Map Toggle */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {sellerLabel && !showMapPreview ? (
            <Badge
              variant="outline"
              className="rounded-full border-none bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs backdrop-blur-md"
            >
              {sellerLabel}
            </Badge>
          ) : null}

          <div className="hidden sm:inline-flex">
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
                    aria-label={showMapPreview ? t('show_photos') : t('map_preview')}
                    className="rounded-full bg-background/90 p-1.5 text-foreground shadow-xs backdrop-blur-md transition hover:scale-110 hover:bg-background cursor-pointer"
                  />
                }
              >
                {showMapPreview ? <Building2 className="size-3.5" /> : <Map className="size-3.5" />}
              </TooltipTrigger>
              <TooltipContent>
                {showMapPreview ? t('show_photos') : t('map_preview')}
              </TooltipContent>
            </Tooltip>
          </div>
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
              {street ? `, ${street}` : ''}
            </span>
          </span>
          {roomsText ? (
            <span className="shrink-0 text-xs font-medium text-muted-foreground ml-2">
              {roomsText}
            </span>
          ) : null}
        </div>

        {/* Title */}
        {offer.title ? (
          <p className="line-clamp-1 text-muted-foreground text-xs font-normal">
            {offer.title}
          </p>
        ) : null}

        {/* Area & Floor */}
        {areaText || floorText ? (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {areaText ? <span>{areaText}</span> : null}
            {areaText && floorText ? <span>•</span> : null}
            {floorText ? <span>{floorText}</span> : null}
          </div>
        ) : null}

        {/* Price */}
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-semibold text-foreground underline decoration-1 underline-offset-2">
            {formatPrice(offer.price, lang, offer.transactionType)}
          </span>
          {pricePerSqm ? (
            <span className="text-xs text-muted-foreground">({pricePerSqm})</span>
          ) : null}
        </div>

        {/* Quick Feature Badges (Max 3 + Overflow) */}
        {visibleBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {visibleBadges.map((badge, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="rounded-md font-normal text-[11px] px-2 py-0.5 bg-muted text-muted-foreground capitalize"
              >
                {badge}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Badge
                variant="secondary"
                className="rounded-md font-normal text-[10px] px-1.5 py-0.5 bg-muted/60 text-muted-foreground"
              >
                +{overflowCount}
              </Badge>
            )}
          </div>
        )}
      </div>
    </a>
  )
}

