import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Grid,
  ArrowLeft,
  Share2,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfferGalleryProps {
  images: string[]
  title: string
  onImageError?: (url: string) => void
  onBack?: () => void
  onShare?: () => void
  isCopied?: boolean
}

export function OfferGallery({
  images,
  title,
  onImageError,
  onBack,
  onShare,
  isCopied = false,
}: OfferGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])

  const openAt = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const nextImage = () => {
    if (images.length > 1) {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || images.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        prevImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, images.length])

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (!isOpen) return
    const el = thumbnailRefs.current[activeIndex]
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [isOpen, activeIndex])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0]?.clientX ?? null
    if (touchEndX !== null) {
      const diff = touchEndX - touchStartXRef.current
      if (diff > 50) prevImage()
      else if (diff < -50) nextImage()
    }
    touchStartXRef.current = null
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[21/9] sm:aspect-[24/9] max-h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl border bg-muted/30 text-muted-foreground shadow-xs">
        <Building2 className="size-10 stroke-1 text-muted-foreground/60" />
        <span className="text-xs text-muted-foreground">Brak zdjęć w ofercie</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border bg-muted/50 shadow-xs select-none">
        {/* Mobile View: Single hero image */}
        <div className="block sm:hidden aspect-[4/3] w-full overflow-hidden cursor-pointer relative" onClick={() => openAt(0)}>
          <img
            src={images[0]}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => onImageError?.(images[0])}
            className="h-full w-full object-cover"
          />

          {/* Floating Back and Share Actions for Mobile */}
          {onBack && (
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onBack()
                }}
                className="pointer-events-auto size-9 p-0 rounded-full bg-background/85 text-foreground backdrop-blur-md shadow-md hover:bg-background cursor-pointer"
                title="Wróć do wyników"
              >
                <ArrowLeft className="size-4" />
              </Button>

              {onShare && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare()
                  }}
                  className="pointer-events-auto size-9 p-0 rounded-full bg-background/85 text-foreground backdrop-blur-md shadow-md hover:bg-background cursor-pointer"
                  title="Udostępnij ofertę"
                >
                  {isCopied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Mosaic View */}
        {images.length === 1 ? (
          <div className="hidden sm:block h-[340px] md:h-[400px] lg:h-[440px] w-full">
            <PhotoTile
              src={images[0]}
              alt={title}
              onClick={() => openAt(0)}
              onError={() => onImageError?.(images[0])}
              className="h-full w-full"
            />
          </div>
        ) : images.length === 2 ? (
          <div className="hidden sm:grid grid-cols-2 gap-2 h-[340px] md:h-[400px] lg:h-[440px] w-full">
            {images.slice(0, 2).map((img, idx) => (
              <PhotoTile
                key={idx}
                src={img}
                alt={`${title} ${idx + 1}`}
                onClick={() => openAt(idx)}
                onError={() => onImageError?.(img)}
                className="h-full w-full"
              />
            ))}
          </div>
        ) : images.length === 3 ? (
          <div className="hidden sm:grid grid-cols-3 gap-2 h-[340px] md:h-[400px] lg:h-[440px] w-full">
            <PhotoTile
              src={images[0]}
              alt={`${title} 1`}
              onClick={() => openAt(0)}
              onError={() => onImageError?.(images[0])}
              className="col-span-2 h-full w-full"
            />
            <div className="grid grid-rows-2 gap-2 col-span-1 h-full min-h-0">
              {images.slice(1, 3).map((img, idx) => (
                <PhotoTile
                  key={idx}
                  src={img}
                  alt={`${title} ${idx + 2}`}
                  onClick={() => openAt(idx + 1)}
                  onError={() => onImageError?.(img)}
                  className="h-full w-full"
                />
              ))}
            </div>
          </div>
        ) : images.length === 4 ? (
          <div className="hidden sm:grid grid-cols-4 gap-2 h-[340px] md:h-[400px] lg:h-[440px] w-full">
            <PhotoTile
              src={images[0]}
              alt={`${title} 1`}
              onClick={() => openAt(0)}
              onError={() => onImageError?.(images[0])}
              className="col-span-2 h-full w-full"
            />
            <div className="grid grid-rows-2 gap-2 col-span-2 h-full min-h-0">
              <PhotoTile
                src={images[1]}
                alt={`${title} 2`}
                onClick={() => openAt(1)}
                onError={() => onImageError?.(images[1])}
                className="h-full w-full"
              />
              <div className="grid grid-cols-2 gap-2 h-full min-h-0">
                {images.slice(2, 4).map((img, idx) => (
                  <PhotoTile
                    key={idx}
                    src={img}
                    alt={`${title} ${idx + 3}`}
                    onClick={() => openAt(idx + 2)}
                    onError={() => onImageError?.(img)}
                    className="h-full w-full"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:grid grid-cols-4 gap-2 h-[340px] md:h-[400px] lg:h-[440px] w-full">
            <PhotoTile
              src={images[0]}
              alt={`${title} 1`}
              onClick={() => openAt(0)}
              onError={() => onImageError?.(images[0])}
              className="col-span-2 h-full w-full"
            />
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full min-h-0">
              {images.slice(1, 5).map((img, idx) => (
                <PhotoTile
                  key={idx}
                  src={img}
                  alt={`${title} ${idx + 2}`}
                  onClick={() => openAt(idx + 1)}
                  onError={() => onImageError?.(img)}
                  className="h-full w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Floating "Show all photos" Button */}
        {images.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 gap-2 rounded-xl bg-background/90 text-xs sm:text-sm font-medium text-foreground shadow-lg backdrop-blur-md hover:bg-background cursor-pointer"
          >
            <Grid className="size-4" />
            Pokaż wszystkie zdjęcia ({images.length})
          </Button>
        )}
      </div>

      {/* Minimal Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="p-0 gap-0 fixed inset-0 top-0 left-0 w-screen h-dvh max-w-none max-h-none translate-x-0 translate-y-0 rounded-none border-0 bg-black sm:fixed sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[95vw] sm:max-w-5xl md:max-w-6xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:border sm:border-zinc-800/80 sm:bg-zinc-950 sm:shadow-2xl flex flex-col overflow-hidden"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            Zdjęcia nieruchomości ({activeIndex + 1} z {images.length})
          </DialogTitle>

          {/* Floating Image Counter */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-md border border-white/10 select-none">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Floating Close Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Zamknij galerię"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex size-9 sm:size-10 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
          >
            <X className="size-5 pointer-events-none" />
          </button>

          {/* Main Photo View */}
          <div
            className="relative flex-1 sm:flex-initial sm:h-[78vh] w-full bg-black flex items-center justify-center overflow-hidden touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 0 && (
              <img
                src={images[activeIndex]}
                alt={`${title} ${activeIndex + 1}`}
                referrerPolicy="no-referrer"
                onError={() => onImageError?.(images[activeIndex])}
                className="h-full w-full object-contain select-none"
              />
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  aria-label="Poprzednie zdjęcie"
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/90 p-2.5 sm:p-3 text-white backdrop-blur-md transition cursor-pointer border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronLeft className="size-5 sm:size-6 pointer-events-none" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  aria-label="Następne zdjęcie"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 hover:bg-black/90 p-2.5 sm:p-3 text-white backdrop-blur-md transition cursor-pointer border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronRight className="size-5 sm:size-6 pointer-events-none" />
                </button>
              </>
            )}
          </div>

          {/* Compact Bottom Thumbnail Dock */}
          {images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto p-2.5 bg-zinc-950 justify-start sm:justify-center border-t border-zinc-900 scrollbar-none items-center">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  ref={(el) => {
                    thumbnailRefs.current[idx] = el
                  }}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative aspect-[4/3] w-14 sm:w-16 shrink-0 overflow-hidden rounded-md transition cursor-pointer ${
                    idx === activeIndex
                      ? 'ring-2 ring-primary opacity-100 scale-105'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => onImageError?.(img)}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function PhotoTile({
  src,
  alt,
  onClick,
  onError,
  className,
}: {
  src: string
  alt: string
  onClick: () => void
  onError?: () => void
  className?: string
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "overflow-hidden cursor-pointer group relative min-h-0",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={onError}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
      />
    </div>
  )
}

