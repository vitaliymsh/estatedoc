import { useState, useMemo, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  ExternalLink,
  Home,
  Calendar,
  Layers,
  Flame,
  ShieldCheck,
  Building,
  CheckCircle2,
  Phone,
} from 'lucide-react'
import { useOfferDetail } from '../hooks/use-offer-detail'
import {
  formatPrice,
  calculatePricePerSqm,
  formatFloor,
  formatSellerType,
  formatMetadataValue,
  IGNORED_METADATA_KEYS,
} from '../lib/formatters'
import { prefetchImages } from '../lib/offer-prefetch'

interface OfferDetailPageProps {
  offerId: number
  onBack: () => void
}

export function OfferDetailPage({ offerId, onBack }: OfferDetailPageProps) {
  const { offer, loading, error } = useOfferDetail(offerId)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const images: string[] = useMemo(() => {
    if (!offer) return []
    if (offer.images && offer.images.length > 0) {
      return offer.images
    }
    if (offer.metadata?.imageUrl && typeof offer.metadata.imageUrl === 'string') {
      return [offer.metadata.imageUrl]
    }
    return []
  }, [offer])

  // Reset selected image when offer changes and prefetch all images
  useEffect(() => {
    setSelectedImageIndex(0)
    if (images.length > 0) {
      prefetchImages(images)
    }
  }, [images])

  if (loading && !offer) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-64 rounded-2xl" />
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

  const nextImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Nav & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-2 rounded-xl text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Wróć do wyników
        </Button>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-foreground uppercase tracking-wide"
          >
            {offer.portal}
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery View */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border bg-muted/70 shadow-xs flex items-center justify-center">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={offer.title}
                  className="h-full w-full object-cover transition-all duration-200"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Building2 className="size-16 stroke-1" />
                  <span className="text-sm">Brak zdjęć w ofercie</span>
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    aria-label="Poprzednie zdjęcie"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow-md backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    aria-label="Następne zdjęcie"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow-md backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                  >
                    <ChevronRight className="size-5" />
                  </button>

                  <Badge
                    variant="outline"
                    className="absolute bottom-3 right-3 border-none bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md"
                  >
                    {selectedImageIndex + 1} / {images.length}
                  </Badge>
                </>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    onMouseEnter={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                      idx === selectedImageIndex
                        ? 'border-primary ring-2 ring-primary/20 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Location Header */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl leading-snug">
              {offer.title}
            </h1>
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 text-primary shrink-0" />
              <span>
                {offer.city}
                {district ? `, ${district}` : ''}
                {street ? `, ul. ${street}` : ''}
              </span>
            </div>
          </div>

          <Separator />

          {/* Quick Specs Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Szczegóły nieruchomości
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {offer.areaSqm && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Home className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Powierzchnia</div>
                    <div className="font-semibold text-foreground text-sm">{offer.areaSqm} m²</div>
                  </div>
                </div>
              )}

              {offer.roomsCount && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Layers className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Liczba pokoi</div>
                    <div className="font-semibold text-foreground text-sm">{offer.roomsCount}</div>
                  </div>
                </div>
              )}

              {floorText && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Building className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Piętro</div>
                    <div className="font-semibold text-foreground text-sm">{floorText}</div>
                  </div>
                </div>
              )}

              {offer.metadata?.buildingType && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Building2 className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Budynek</div>
                    <div className="font-semibold text-foreground text-sm truncate">
                      {String(offer.metadata.buildingType)}
                    </div>
                  </div>
                </div>
              )}

              {offer.metadata?.yearBuilt && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Calendar className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Rok budowy</div>
                    <div className="font-semibold text-foreground text-sm">
                      {String(offer.metadata.yearBuilt)}
                    </div>
                  </div>
                </div>
              )}

              {offer.metadata?.heating && (
                <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-3.5 shadow-2xs">
                  <Flame className="size-5 text-primary shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Ogrzewanie</div>
                    <div className="font-semibold text-foreground text-sm truncate">
                      {String(offer.metadata.heating)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <Card className="rounded-2xl border bg-card shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Opis oferty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {offer.description || 'Brak opisu dla tej oferty.'}
              </p>
            </CardContent>
          </Card>

          {/* Extra Metadata Tags */}
          {metadataEntries.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dodatkowe informacje
              </h2>
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

        {/* Right Sidebar (1 Col Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
              {/* Price Row */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Cena nieruchomości</span>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {formatPrice(offer.price)}
                </div>
                {pricePerSqm && (
                  <div className="text-xs font-medium text-muted-foreground">
                    Cena za m²: <span className="text-foreground">{pricePerSqm}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Direct Link CTA */}
              <div className="space-y-2">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    size: 'lg',
                    className: 'w-full gap-2 rounded-xl font-semibold shadow-xs',
                  })}
                >
                  Oryginalna oferta na {offer.portal}
                  <ExternalLink className="size-4" />
                </a>
                <p className="text-center text-[11px] text-muted-foreground">
                  Przejdź do portalu źródłowego, aby skontaktować się ze sprzedającym.
                </p>
              </div>

              {/* Agency / Seller Info */}
              {(offer.metadata?.agencyName || offer.metadata?.agencyPhone) && (
                <>
                  <Separator />
                  <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-primary" />
                      Kontakt / Agencja
                    </div>
                    {offer.metadata.agencyName && (
                      <p className="text-xs text-muted-foreground">
                        {String(offer.metadata.agencyName)}
                      </p>
                    )}
                    {offer.metadata.agencyPhone && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <a
                          href={`tel:${String(offer.metadata.agencyPhone)}`}
                          className="hover:underline"
                        >
                          {String(offer.metadata.agencyPhone)}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Guarantee / Source info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span>Oferta pobrana bezpośrednio z portalu {offer.portal}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
