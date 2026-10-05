import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  Calendar,
  Layers,
  Flame,
  ShieldCheck,
  Building,
  Phone,
  Share2,
  Check,
  Maximize2,
  FileText,
  Tag,
  Sparkles,
  TreePine,
} from 'lucide-react'
import { useOfferDetail } from '../hooks/use-offer-detail'
import { OfferGallery } from './OfferGallery'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  formatRelativeTime,
  buildGoogleMapsUrl,
  formatPropertyType,
  formatTransactionType,
  normalizeOfferImages,
  formatDescriptionText,
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'
import { ListingMap } from './ListingMap'
import { useTranslation } from '@/lib/i18n'

interface OfferDetailPageProps {
  offerId: number
  onBack: () => void
}

export function OfferDetailPage({ offerId, onBack }: OfferDetailPageProps) {
  const { lang, t } = useTranslation()
  const { offer, loading, error } = useOfferDetail(offerId)
  const [isCopied, setIsCopied] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const rawImages = offer ? normalizeOfferImages(offer.images, offer.metadata?.imageUrl) : []
  const images = rawImages.filter((img) => !failedImages.has(img))

  const handleImageError = (imgUrl: string) => {
    setFailedImages((prev) => {
      const next = new Set(prev)
      next.add(imgUrl)
      return next
    })
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const formattedDescription = formatDescriptionText(offer?.description)

  if (loading && !offer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <Alert variant="destructive" className="text-left">
          <AlertTitle className="font-semibold text-base">
            {t('listing_not_found')}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {error || t('listing_not_found_desc')}
          </AlertDescription>
        </Alert>
        <Button onClick={onBack} variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="size-4" />
          {t('back_to_list')}
        </Button>
      </div>
    )
  }

  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm, lang)
  const district = offer.district || (offer.metadata?.district as string | undefined)
  const street = offer.street || (offer.metadata?.street as string | undefined)
  const sellerLabel = formatSellerType(
    offer.sellerType || (offer.metadata?.sellerType as string | undefined),
    lang
  )
  const floorText = formatFloor(offer.floor, offer.totalFloors, lang)
  const relativeTime = formatRelativeTime(offer.createdAt, lang)
  const googleMapsUrl = buildGoogleMapsUrl(offer.city, district, street)
  const propertyTypeLabel = formatPropertyType(offer.propertyType, lang)
  const transactionTypeLabel = formatTransactionType(offer.transactionType, lang)
  const phone = (offer.metadata?.agencyPhone as string | undefined) || (offer.metadata?.phone as string | undefined)

  const metadataEntries = offer.metadata
    ? Object.entries(offer.metadata).filter(
        ([key, val]) => !IGNORED_METADATA_KEYS.has(key) && val !== null && val !== undefined
      )
    : []

  const isLongDescription = (formattedDescription.length || 0) > 350

  const hasApartmentParams = Boolean(
    offer.areaSqm ||
      offer.roomsCount ||
      floorText ||
      offer.metadata?.condition ||
      offer.metadata?.marketType ||
      offer.metadata?.plotSqm
  )

  const hasBuildingParams = Boolean(
    offer.metadata?.yearBuilt ||
      offer.metadata?.buildingMaterial ||
      offer.metadata?.buildingType ||
      offer.metadata?.hasElevator !== undefined ||
      offer.metadata?.heating
  )

  const hasFeeParams = Boolean(
    offer.metadata?.rentExtra ||
      offer.metadata?.deposit !== undefined ||
      offer.metadata?.ownership
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8 space-y-5 sm:space-y-6 pb-20 md:pb-8 flex flex-col">
      {/* Top Navigation Row (Desktop & Tablet only — Mobile uses floating gallery controls) */}
      <div className="hidden md:flex items-center justify-between gap-4 order-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 rounded-xl text-sm font-medium hover:bg-accent cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="size-4" />
          {t('back_to_results')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="gap-1.5 rounded-xl text-xs font-medium cursor-pointer shadow-2xs hover:bg-accent"
        >
          {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
          {isCopied ? t('link_copied') : t('share')}
        </Button>
      </div>

      {/* Offer Gallery & Lightbox (Order 1 on mobile: Photo First! Order 3 on desktop) */}
      <div className="order-1 md:order-3">
        <OfferGallery
          images={images}
          title={offer.title}
          onImageError={handleImageError}
          onBack={onBack}
          onShare={handleCopyLink}
          isCopied={isCopied}
        />
      </div>

      {/* De-cluttered Title & Info Section (Order 2 on mobile: under photo. Order 2 on desktop) */}
      <div className="order-2 md:order-2 space-y-2">
        {/* Unified Subtle Metadata Line (Replaces 4 redundant pill badges) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="text-foreground font-bold">{offer.portal}</span>
          <span>•</span>
          <span>{sellerLabel || transactionTypeLabel}</span>
          {propertyTypeLabel && propertyTypeLabel !== 'Nieruchomość' && (
            <>
              <span>•</span>
              <span>{propertyTypeLabel}</span>
            </>
          )}
          <span>•</span>
          <span className="normal-case font-normal">{relativeTime}</span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
          {offer.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline hover:text-primary transition"
          >
            <MapPin className="size-4 text-primary shrink-0" />
            <span>
              {offer.city}
              {district ? `, ${district}` : ''}
              {street ? `, ul. ${street}` : ''}
            </span>
            <ExternalLink className="size-3 ml-0.5 opacity-60" />
          </a>
        </div>

        {/* Universal Key Highlights Badge Strip (Mobile, Tablet, Desktop) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
          {offer.areaSqm && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground">
              <Maximize2 className="size-3.5 text-primary" />
              {offer.areaSqm} m²
            </span>
          )}
          {offer.roomsCount && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground">
              <Layers className="size-3.5 text-primary" />
              {offer.roomsCount} {t('rooms')}
            </span>
          )}
          {floorText && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground">
              <Building className="size-3.5 text-primary" />
              {floorText}
            </span>
          )}
          {offer.metadata?.marketType && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground">
              <Tag className="size-3.5 text-primary" />
              {offer.metadata.marketType === 'primary'
                ? t('market_primary_full')
                : offer.metadata.marketType === 'secondary'
                  ? t('market_secondary_full')
                  : String(offer.metadata.marketType)}
            </span>
          )}
          {offer.metadata?.plotSqm && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs sm:text-sm font-semibold text-foreground">
              <TreePine className="size-3.5 text-primary" />
              {String(offer.metadata.plotSqm)} m²
            </span>
          )}
        </div>
      </div>

      {/* Main Content & Sidebar Layout (2-Column from Tablet md: upwards) */}
      <div className="order-4 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Column (2 Cols on Tablet & Desktop) */}
        <div className="space-y-6 md:col-span-2">
          {/* "Parametry nieruchomości" Card */}
          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-foreground">
                {t('property_parameters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. Mieszkanie */}
              {hasApartmentParams && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('unit')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {offer.areaSqm && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Maximize2 className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('area')}:</span>
                        <span className="font-medium text-foreground ml-auto">{offer.areaSqm} m²</span>
                      </div>
                    )}

                    {offer.roomsCount && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('number_of_rooms')}:</span>
                        <span className="font-medium text-foreground ml-auto">{offer.roomsCount}</span>
                      </div>
                    )}

                    {floorText && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Building className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('floor')}:</span>
                        <span className="font-medium text-foreground ml-auto">{floorText}</span>
                      </div>
                    )}

                    {offer.metadata?.condition && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Sparkles className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('condition')}:</span>
                        <span className="font-medium text-foreground ml-auto">{String(offer.metadata.condition)}</span>
                      </div>
                    )}

                    {offer.metadata?.marketType && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Tag className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('market')}:</span>
                        <span className="font-medium text-foreground ml-auto">
                          {offer.metadata.marketType === 'primary'
                            ? t('market_primary')
                            : offer.metadata.marketType === 'secondary'
                              ? t('market_secondary')
                              : String(offer.metadata.marketType)}
                        </span>
                      </div>
                    )}

                    {offer.metadata?.plotSqm && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <TreePine className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('plot')}:</span>
                        <span className="font-medium text-foreground ml-auto">{String(offer.metadata.plotSqm)} m²</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Budynek */}
              {hasBuildingParams && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('building')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {offer.metadata?.yearBuilt && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Calendar className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('year_built')}:</span>
                        <span className="font-medium text-foreground ml-auto">{String(offer.metadata.yearBuilt)}</span>
                      </div>
                    )}

                    {offer.metadata?.buildingMaterial && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('material')}:</span>
                        <span className="font-medium text-foreground ml-auto capitalize truncate max-w-[160px] text-right">
                          {String(offer.metadata.buildingMaterial)}
                        </span>
                      </div>
                    )}

                    {offer.metadata?.buildingType && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Building2 className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('building_type')}:</span>
                        <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right">
                          {String(offer.metadata.buildingType)}
                        </span>
                      </div>
                    )}

                    {offer.metadata?.hasElevator !== undefined && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Building className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('elevator')}:</span>
                        <span className="font-medium text-foreground ml-auto">
                          {offer.metadata.hasElevator ? t('yes') : t('no')}
                        </span>
                      </div>
                    )}

                    {offer.metadata?.heating && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Flame className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('heating')}:</span>
                        <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right capitalize">
                          {String(offer.metadata.heating)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Opłaty i formalności */}
              {hasFeeParams && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('fees_and_legal')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {offer.metadata?.rentExtra && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <Tag className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('admin_fee')}:</span>
                        <span className="font-medium text-foreground ml-auto">{offer.metadata.rentExtra} {t('currency')}</span>
                      </div>
                    )}

                    {offer.metadata?.deposit !== undefined && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <ShieldCheck className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('deposit_term')}:</span>
                        <span className="font-medium text-foreground ml-auto">
                          {offer.metadata.deposit === 0
                            ? t('deposit_none')
                            : `${offer.metadata.deposit} ${t('currency')}`}
                        </span>
                      </div>
                    )}

                    {offer.metadata?.ownership && (
                      <div className="flex items-center gap-3 py-2 border-b border-border/50">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{t('ownership')}:</span>
                        <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right capitalize">
                          {String(offer.metadata.ownership)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extra Dynamic Metadata Tags */}
              {metadataEntries.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <Accordion defaultValue={['metadata']} className="w-full">
                    <AccordionItem value="metadata" className="border-none">
                      <AccordionTrigger className="py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline cursor-pointer">
                        {t('other_source_info', { count: metadataEntries.length })}
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {metadataEntries.map(([key, val]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="rounded-lg px-3 py-1 font-normal text-xs bg-muted text-muted-foreground"
                            >
                              {formatMetadataValue(key, val, lang)}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities & Feature Pills */}
          {(offer.metadata?.hasElevator ||
            offer.metadata?.hasBalcony ||
            offer.metadata?.hasParking ||
            offer.metadata?.hasBasement ||
            offer.metadata?.hasAirConditioning ||
            offer.metadata?.isFurnished ||
            offer.metadata?.isPetFriendly ||
            (offer.metadata?.tags && offer.metadata.tags.length > 0) ||
            offer.metadata?.airQuality ||
            offer.metadata?.noiseLevel) && (
            <Card className="rounded-2xl border bg-card shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {t('amenities_and_highlights')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {offer.metadata?.hasElevator ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Building className="size-3.5 text-primary" /> {t('elevator_in_building')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.hasBalcony ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Check className="size-3.5 text-primary" /> {t('balcony_terrace')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.hasParking ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Check className="size-3.5 text-primary" /> {t('parking_garage')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.hasBasement ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Check className="size-3.5 text-primary" /> {t('basement_storage')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.hasAirConditioning ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Sparkles className="size-3.5 text-primary" /> {t('air_conditioning')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.isFurnished ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Check className="size-3.5 text-primary" /> {t('furnished')}
                    </Badge>
                  ) : null}
                  {offer.metadata?.isPetFriendly ? (
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                      <Check className="size-3.5 text-primary" /> {t('pet_friendly')}
                    </Badge>
                  ) : null}
                </div>

                {((offer.metadata?.tags && Array.isArray(offer.metadata.tags) && offer.metadata.tags.length > 0) ||
                  offer.metadata?.airQuality ||
                  offer.metadata?.noiseLevel) && (
                  <div className="pt-3 border-t border-border/40 flex flex-wrap gap-2 items-center">
                    {Array.isArray(offer.metadata?.tags) &&
                      offer.metadata.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground border-primary/20 bg-primary/5"
                        >
                          #{String(tag)}
                        </Badge>
                      ))}
                    {offer.metadata?.airQuality && (
                      <Badge
                        variant="outline"
                        className="rounded-lg px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                      >
                        {t('air_quality')}: {String(offer.metadata.airQuality)}
                      </Badge>
                    )}
                    {offer.metadata?.noiseLevel && (
                      <Badge
                        variant="outline"
                        className="rounded-lg px-2.5 py-1 text-xs text-sky-600 dark:text-sky-400 border-sky-500/20 bg-sky-500/5"
                      >
                        {t('noise_level')}: {String(offer.metadata.noiseLevel)}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description Card (only rendered if description is present) */}
          {offer.description?.trim() && (
            <Card className="rounded-2xl border bg-card shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {t('about_property')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <div
                  className={`relative ${
                    !isDescriptionExpanded && isLongDescription ? 'max-h-44 overflow-hidden' : ''
                  }`}
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {formatDescriptionText(offer.description)}
                  </p>
                  {!isDescriptionExpanded && isLongDescription && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                  )}
                </div>

                {isLongDescription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="mt-1 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {isDescriptionExpanded ? t('show_less_description') : t('read_full_description')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {/* Mobile Agency / Trust & Metadata Strip (Replaces orphaned sidebar box on mobile) */}
          <div className="block md:hidden rounded-2xl border bg-card/60 p-4 shadow-2xs space-y-3">
            {offer.metadata?.agencyName && (
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    {t('agency_contact')}
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {String(offer.metadata.agencyName)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>ID: <code className="font-mono text-foreground/80">{offer.externalId}</code></span>
              <span>{relativeTime}</span>
            </div>
            <div className="flex items-center justify-between pt-0.5 text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={handleCopyLink}
                className="hover:text-foreground underline underline-offset-2 cursor-pointer"
              >
                {t('copy_link')}
              </button>
              <a
                href={offer.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground underline underline-offset-2"
              >
                {t('report_listing')}
              </a>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col Sticky Sidebar Card - Desktop & Tablet) */}
        <div className="hidden md:block md:col-span-1">
          <div className="sticky top-20 lg:top-24 space-y-4">
            <Card className="rounded-2xl border bg-card p-4 sm:p-5 lg:p-6 shadow-md space-y-3 sm:space-y-4">
              {/* Tablet & Desktop Price & Actions */}
              <div className="space-y-4">
                {/* Price Row */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{t('total_price')}</span>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {formatPrice(offer.price, lang)}
                  </div>
                  {pricePerSqm && (
                    <div className="text-xs font-medium text-muted-foreground">
                      {t('price_per_sqm_label')} <span className="font-semibold text-foreground">{pricePerSqm}</span>
                    </div>
                  )}
                </div>

                {/* Direct Actions */}
                {phone ? (
                  <div className="space-y-2">
                    <a
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className={buttonVariants({
                        size: 'lg',
                        className: 'w-full gap-2 rounded-xl font-semibold shadow-xs cursor-pointer',
                      })}
                    >
                      <Phone className="size-4" />
                      {t('call_with_phone', { phone })}
                    </a>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'default',
                        className: 'w-full gap-2 rounded-xl font-medium shadow-2xs cursor-pointer hover:bg-accent',
                      })}
                    >
                      {t('view_on_portal', { portal: offer.portal })}
                      <ExternalLink className="size-3.5 opacity-70" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        size: 'lg',
                        className: 'w-full gap-2 rounded-xl font-semibold shadow-xs cursor-pointer',
                      })}
                    >
                      {t('view_on_portal', { portal: offer.portal })}
                      <ExternalLink className="size-4" />
                    </a>
                    <p className="text-center text-[11px] text-muted-foreground">
                      {t('visit_source_portal_hint')}
                    </p>
                  </div>
                )}
              </div>

              {/* Agency / Seller Contact Box */}
              {offer.metadata?.agencyName && (
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 p-2.5 sm:p-3">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                      {t('agency_contact')}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {String(offer.metadata.agencyName)}
                    </p>
                  </div>
                </div>
              )}

              {/* Trust Badge, External ID fineprint & Actions */}
              <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center justify-between text-[11px]">
                  <span>ID: <code className="font-mono text-foreground/80">{offer.externalId}</code></span>
                  <span>{relativeTime}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="hover:text-foreground underline underline-offset-2 cursor-pointer"
                  >
                    {t('copy_link')}
                  </button>
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    {t('report_listing')}
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Separator className="order-5" />

      {/* Full-Width Interactive Map Section */}
      <div className="order-6 space-y-4 pt-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">{t('location')}</h3>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'gap-2 rounded-xl text-xs font-medium cursor-pointer',
            })}
          >
            <MapPin className="size-3.5 text-primary" />
            {t('open_in_gmaps')}
            <ExternalLink className="size-3 opacity-70" />
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-muted/20 shadow-xs">
          <ListingMap offer={offer} className="h-[280px] sm:h-[380px] lg:h-[460px] w-full" />
        </div>
      </div>

      {/* Mobile Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 md:hidden bg-background/95 backdrop-blur-md border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <div className="text-base font-bold text-foreground truncate leading-none">
            {formatPrice(offer.price, lang)}
          </div>
          {pricePerSqm && (
            <div className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
              {pricePerSqm}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className={buttonVariants({
                size: 'default',
                className: 'gap-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer h-10 px-3.5 shadow-xs',
              })}
            >
              <Phone className="size-3.5" />
              {t('call')}
            </a>
          ) : null}
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: phone ? 'outline' : 'default',
              size: 'default',
              className: 'gap-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer h-10 px-3.5 shadow-2xs',
            })}
          >
            {t('listing_btn')}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
