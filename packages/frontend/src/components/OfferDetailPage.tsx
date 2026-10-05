import { useState, useMemo, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  ExternalLink,
  Calendar,
  Layers,
  Flame,
  ShieldCheck,
  Building,
  Phone,
  Grid,
  Share2,
  Check,
  Maximize2,
  FileText,
  Tag,
  Sparkles,
  TreePine,
} from 'lucide-react'
import { useOfferDetail } from '../hooks/use-offer-detail'
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
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'
import { prefetchImages } from '../lib/offer-prefetch'
import { ListingMap } from './ListingMap'

interface OfferDetailPageProps {
  offerId: number
  onBack: () => void
}

export function OfferDetailPage({ offerId, onBack }: OfferDetailPageProps) {
  const { offer, loading, error } = useOfferDetail(offerId)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0)
  const [isCopied, setIsCopied] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const images = useMemo(() => {
    if (!offer) return []
    return normalizeOfferImages(offer.images, offer.metadata?.imageUrl)
  }, [offer?.images, offer?.metadata?.imageUrl])

  useEffect(() => {
    if (images.length > 0) {
      prefetchImages(images)
    }
  }, [images])

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const openGalleryAt = (index: number) => {
    setActiveModalImageIndex(index)
    setIsGalleryOpen(true)
  }

  const nextModalImage = () => {
    if (images.length > 1) {
      setActiveModalImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevModalImage = () => {
    if (images.length > 1) {
      setActiveModalImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Nie znaleziono oferty</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'Wybrana oferta nie istnieje lub została usunięta.'}</p>
        <Button onClick={onBack} variant="outline" className="mt-6 gap-2">
          <ArrowLeft className="size-4" />
          Wróć do listy ofert
        </Button>
      </div>
    )
  }

  const pricePerSqm = calculatePricePerSqm(offer.price, offer.areaSqm)
  const district = offer.district || (offer.metadata?.district as string | undefined)
  const street = offer.street || (offer.metadata?.street as string | undefined)
  const sellerLabel = formatSellerType(
    offer.sellerType || (offer.metadata?.sellerType as string | undefined)
  )
  const floorText = formatFloor(offer.floor, offer.totalFloors)
  const relativeTime = formatRelativeTime(offer.createdAt)
  const googleMapsUrl = buildGoogleMapsUrl(offer.city, district, street)
  const propertyTypeLabel = formatPropertyType(offer.propertyType)
  const transactionTypeLabel = formatTransactionType(offer.transactionType)

  const metadataEntries = offer.metadata
    ? Object.entries(offer.metadata).filter(
        ([key, val]) => !IGNORED_METADATA_KEYS.has(key) && val !== null && val !== undefined
      )
    : []

  const isLongDescription = (offer.description?.length || 0) > 350

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 rounded-xl text-sm font-medium hover:bg-accent cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Wróć do wyników
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 rounded-xl text-xs font-medium cursor-pointer"
          >
            {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
            {isCopied ? 'Skopiowano link' : 'Udostępnij'}
          </Button>

          <Badge
            variant="outline"
            className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            {offer.portal}
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs font-medium"
          >
            {transactionTypeLabel}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-xs font-medium"
          >
            {propertyTypeLabel}
          </Badge>
          {sellerLabel && (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              {sellerLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Title & Location Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {offer.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary transition"
          >
            <MapPin className="size-4 text-primary shrink-0" />
            <span>
              {offer.city}
              {district ? `, ${district}` : ''}
              {street ? `, ul. ${street}` : ''}
            </span>
            <ExternalLink className="size-3 ml-0.5 opacity-70" />
          </a>
          <span>•</span>
          <span>{relativeTime}</span>
        </div>
      </div>

      {/* Airbnb-style Photo Mosaic Grid */}
      <div className="relative overflow-hidden rounded-2xl border bg-muted/50 shadow-xs">
        {images.length === 0 ? (
          <div className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="size-16 stroke-1" />
            <span className="text-sm">Brak zdjęć w ofercie</span>
          </div>
        ) : images.length === 1 ? (
          <div
            onClick={() => openGalleryAt(0)}
            className="aspect-[16/7] w-full overflow-hidden cursor-pointer group"
          >
            <img
              src={images[0]}
              alt={offer.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-2 aspect-[16/8]">
            {images.slice(0, 2).map((img, idx) => (
              <div
                key={idx}
                onClick={() => openGalleryAt(idx)}
                className="overflow-hidden cursor-pointer group"
              >
                <img
                  src={img}
                  alt={`${offer.title} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
            ))}
          </div>
        ) : images.length === 3 ? (
          <div className="grid grid-cols-3 gap-2 aspect-[16/8]">
            <div
              onClick={() => openGalleryAt(0)}
              className="col-span-2 overflow-hidden cursor-pointer group"
            >
              <img
                src={images[0]}
                alt={`${offer.title} 1`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
            </div>
            <div className="grid grid-rows-2 gap-2 col-span-1">
              {images.slice(1, 3).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => openGalleryAt(idx + 1)}
                  className="overflow-hidden cursor-pointer group"
                >
                  <img
                    src={img}
                    alt={`${offer.title} ${idx + 2}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 4 or 5+ photos Airbnb Mosaic */
          <div className="grid grid-cols-4 gap-2 aspect-[16/9] max-h-[460px]">
            {/* Main large photo on left (2 cols) */}
            <div
              onClick={() => openGalleryAt(0)}
              className="col-span-2 row-span-2 overflow-hidden cursor-pointer group relative"
            >
              <img
                src={images[0]}
                alt={`${offer.title} 1`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
            </div>
            {/* 4 smaller photos on right in 2x2 */}
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {images.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => openGalleryAt(idx + 1)}
                  className="overflow-hidden cursor-pointer group relative"
                >
                  <img
                    src={img}
                    alt={`${offer.title} ${idx + 2}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Floating "Show all photos" Button */}
        {images.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGalleryOpen(true)}
            className="absolute bottom-4 right-4 gap-2 rounded-xl bg-background/90 font-medium text-foreground shadow-lg backdrop-blur-md hover:bg-background cursor-pointer"
          >
            <Grid className="size-4" />
            Pokaż wszystkie zdjęcia ({images.length})
          </Button>
        )}
      </div>

      {/* Full-Screen Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border rounded-2xl sm:max-w-4xl">
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
            <DialogTitle className="text-base font-semibold">
              Zdjęcia nieruchomości ({activeModalImageIndex + 1} z {images.length})
            </DialogTitle>
          </DialogHeader>

          <div className="relative aspect-[16/10] w-full bg-black/95 flex items-center justify-center overflow-hidden">
            {images.length > 0 && (
              <img
                src={images[activeModalImageIndex]}
                alt={offer.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevModalImage}
                  aria-label="Poprzednie zdjęcie"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={nextModalImage}
                  aria-label="Następne zdjęcie"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* Modal Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 bg-muted/40 border-t">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveModalImageIndex(idx)}
                  className={`relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg border-2 transition cursor-pointer ${
                    idx === activeModalImageIndex
                      ? 'border-primary ring-2 ring-primary/20 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content & Sidebar Layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 items-start">
        {/* Left Column (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key Highlight Features List */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground text-sm">Lokalizacja</div>
                <p className="text-xs text-muted-foreground">
                  {offer.city}{district ? `, dzielnica ${district}` : ''}{street ? `, ulica ${street}` : ''}.
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium underline underline-offset-2 mt-1 hover:opacity-80"
                >
                  Zobacz w Google Maps
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {(offer.metadata?.buildingType || offer.metadata?.yearBuilt || offer.metadata?.condition || floorText) && (
              <div className="flex items-start gap-4">
                <Building className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground text-sm">Budynek i stan techniczny</div>
                  <p className="text-xs text-muted-foreground">
                    {[
                      offer.metadata?.buildingType ? `Typ zabudowy: ${offer.metadata.buildingType}` : null,
                      floorText ? floorText : null,
                      offer.metadata?.yearBuilt ? `Rok budowy: ${offer.metadata.yearBuilt}` : null,
                      offer.metadata?.condition ? `Stan: ${offer.metadata.condition}` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              </div>
            )}

            {(offer.metadata?.heating || offer.metadata?.ownership || offer.metadata?.marketType) && (
              <div className="flex items-start gap-4">
                <Flame className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground text-sm">Szczegóły transakcji i media</div>
                  <p className="text-xs text-muted-foreground">
                    {[
                      offer.metadata?.marketType ? `Rynek ${String(offer.metadata.marketType).toLowerCase()}` : null,
                      offer.metadata?.heating ? `Ogrzewanie: ${offer.metadata.heating}` : null,
                      offer.metadata?.ownership ? `Własność: ${offer.metadata.ownership}` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">O tej nieruchomości</h3>
            <div className={`relative ${!isDescriptionExpanded && isLongDescription ? 'max-h-48 overflow-hidden' : ''}`}>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {offer.description || 'Brak dodatkowego opisu dla tego ogłoszenia.'}
              </p>
              {!isDescriptionExpanded && isLongDescription && (
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              )}
            </div>

            {isLongDescription && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isDescriptionExpanded ? 'Zwiń opis' : 'Pokaż więcej opisu'}
              </Button>
            )}
          </div>

          <Separator />

          {/* "Parametry i wyposażenie" (Clean 2-column specs grid, no internal IDs) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Parametry nieruchomości</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {offer.areaSqm && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Maximize2 className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Powierzchnia:</span>
                  <span className="font-medium text-foreground ml-auto">{offer.areaSqm} m²</span>
                </div>
              )}

              {offer.roomsCount && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Layers className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Liczba pokoi:</span>
                  <span className="font-medium text-foreground ml-auto">{offer.roomsCount}</span>
                </div>
              )}

              {floorText && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Building className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Piętro:</span>
                  <span className="font-medium text-foreground ml-auto">{floorText}</span>
                </div>
              )}

              {offer.metadata?.buildingType && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Building2 className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Rodzaj zabudowy:</span>
                  <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right">
                    {String(offer.metadata.buildingType)}
                  </span>
                </div>
              )}

              {offer.metadata?.yearBuilt && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Calendar className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Rok budowy:</span>
                  <span className="font-medium text-foreground ml-auto">{String(offer.metadata.yearBuilt)}</span>
                </div>
              )}

              {offer.metadata?.marketType && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Tag className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Rynek:</span>
                  <span className="font-medium text-foreground ml-auto">{String(offer.metadata.marketType)}</span>
                </div>
              )}

              {offer.metadata?.condition && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Stan wykończenia:</span>
                  <span className="font-medium text-foreground ml-auto">{String(offer.metadata.condition)}</span>
                </div>
              )}

              {offer.metadata?.heating && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <Flame className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Ogrzewanie:</span>
                  <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right">
                    {String(offer.metadata.heating)}
                  </span>
                </div>
              )}

              {offer.metadata?.ownership && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Forma własności:</span>
                  <span className="font-medium text-foreground ml-auto truncate max-w-[160px] text-right">
                    {String(offer.metadata.ownership)}
                  </span>
                </div>
              )}

              {offer.metadata?.plotSqm && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <TreePine className="size-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Działka:</span>
                  <span className="font-medium text-foreground ml-auto">{String(offer.metadata.plotSqm)} m²</span>
                </div>
              )}
            </div>

            {/* Extra Dynamic Metadata Tags */}
            {metadataEntries.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inne informacje ze źródła
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadataEntries.map(([key, val]) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="rounded-lg px-3 py-1 font-normal text-xs bg-muted text-muted-foreground"
                    >
                      {formatMetadataValue(key, val)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Interactive Map Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Lokalizacja na mapie</h3>
                <p className="text-xs text-muted-foreground">
                  {offer.city}{district ? `, dzielnica ${district}` : ''}{street ? `, ul. ${street}` : ''}
                </p>
              </div>
            </div>
            <ListingMap offer={offer} height="380px" />
          </div>
        </div>

        {/* Right Column (1 Col Sticky Sidebar Card) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="rounded-2xl border bg-card p-6 shadow-md space-y-5">
              {/* Price Row */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Cena całkowita</span>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatPrice(offer.price)}
                </div>
                {pricePerSqm && (
                  <div className="text-xs font-medium text-muted-foreground">
                    Cena za metr kwadratowy: <span className="font-semibold text-foreground">{pricePerSqm}</span>
                  </div>
                )}
              </div>

              {/* Direct Link CTA */}
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
                  Przejdź do oferty na {offer.portal}
                  <ExternalLink className="size-4" />
                </a>
                <p className="text-center text-[11px] text-muted-foreground">
                  Przejdź do portalu źródłowego, aby skontaktować się ze sprzedającym.
                </p>
              </div>

              {/* Agency / Seller Contact Box (Only if agency name or phone available) */}
              {(offer.metadata?.agencyName || offer.metadata?.agencyPhone) && (
                <>
                  <Separator />
                  <div className="space-y-2.5 rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-primary" />
                      Kontakt z biurem
                    </div>
                    {offer.metadata.agencyName && (
                      <p className="text-xs font-medium text-foreground">
                        {String(offer.metadata.agencyName)}
                      </p>
                    )}
                    {offer.metadata.agencyPhone && (
                      <a
                        href={`tel:${String(offer.metadata.agencyPhone)}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {String(offer.metadata.agencyPhone)}
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Trust Badge, External ID fineprint & Actions */}
              <div className="space-y-2 pt-1 border-t text-xs text-muted-foreground">
                <div className="flex items-center justify-between text-[11px]">
                  <span>ID: <code className="font-mono text-foreground/80">{offer.externalId}</code></span>
                  <span>{relativeTime}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="hover:text-foreground underline underline-offset-2 cursor-pointer"
                  >
                    Kopiuj link
                  </button>
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    Zgłoś ogłoszenie
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
