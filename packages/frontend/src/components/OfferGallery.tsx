import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Grid,
} from 'lucide-react'

interface OfferGalleryProps {
  images: string[]
  title: string
  onImageError?: (url: string) => void
}

export function OfferGallery({ images, title, onImageError }: OfferGalleryProps) {
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
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length])

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || images.length <= 1) return

    const nextIdx = (activeIndex + 1) % images.length
    const prevIdx = (activeIndex - 1 + images.length) % images.length

    if (images[nextIdx]) {
      const img = new Image()
      img.src = images[nextIdx]
    }
    if (images[prevIdx]) {
      const img = new Image()
      img.src = images[prevIdx]
    }
  }, [isOpen, activeIndex, images])

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
        <div className="block sm:hidden aspect-[4/3] w-full overflow-hidden cursor-pointer" onClick={() => openAt(0)}>
          <img
            src={images[0]}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => onImageError?.(images[0])}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Desktop Mosaic View */}
        <div className="hidden sm:block">
          {images.length === 1 ? (
            <div
              onClick={() => openAt(0)}
              className="aspect-[16/7] w-full overflow-hidden cursor-pointer group"
            >
              <img
                src={images[0]}
                alt={title}
                referrerPolicy="no-referrer"
                onError={() => onImageError?.(images[0])}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
            </div>
          ) : images.length === 2 ? (
            <div className="grid grid-cols-2 gap-2 aspect-[16/8]">
              {images.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => openAt(idx)}
                  className="overflow-hidden cursor-pointer group"
                >
                  <img
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={() => onImageError?.(img)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              ))}
            </div>
          ) : images.length === 3 ? (
            <div className="grid grid-cols-3 gap-2 aspect-[16/8]">
              <div
                onClick={() => openAt(0)}
                className="col-span-2 overflow-hidden cursor-pointer group"
              >
                <img
                  src={images[0]}
                  alt={`${title} 1`}
                  referrerPolicy="no-referrer"
                  onError={() => onImageError?.(images[0])}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <div className="grid grid-rows-2 gap-2 col-span-1">
                {images.slice(1, 3).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => openAt(idx + 1)}
                    className="overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={img}
                      alt={`${title} ${idx + 2}`}
                      referrerPolicy="no-referrer"
                      onError={() => onImageError?.(img)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : images.length === 4 ? (
            <div className="grid grid-cols-3 gap-2 aspect-[16/8]">
              <div
                onClick={() => openAt(0)}
                className="col-span-2 overflow-hidden cursor-pointer group"
              >
                <img
                  src={images[0]}
                  alt={`${title} 1`}
                  referrerPolicy="no-referrer"
                  onError={() => onImageError?.(images[0])}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <div className="grid grid-rows-3 gap-2 col-span-1">
                {images.slice(1, 4).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => openAt(idx + 1)}
                    className="overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={img}
                      alt={`${title} ${idx + 2}`}
                      referrerPolicy="no-referrer"
                      onError={() => onImageError?.(img)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 aspect-[16/9] max-h-[460px]">
              <div
                onClick={() => openAt(0)}
                className="col-span-2 row-span-2 overflow-hidden cursor-pointer group relative"
              >
                <img
                  src={images[0]}
                  alt={`${title} 1`}
                  referrerPolicy="no-referrer"
                  onError={() => onImageError?.(images[0])}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
                {images.slice(1, 5).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => openAt(idx + 1)}
                    className="overflow-hidden cursor-pointer group relative"
                  >
                    <img
                      src={img}
                      alt={`${title} ${idx + 2}`}
                      referrerPolicy="no-referrer"
                      onError={() => onImageError?.(img)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

      {/* Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-5xl p-0 overflow-hidden bg-zinc-950 text-zinc-100 border-zinc-800 rounded-2xl sm:max-w-4xl"
          showCloseButton={true}
        >
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-zinc-800/80">
            <DialogTitle className="text-base font-semibold text-zinc-100">
              Zdjęcia nieruchomości ({activeIndex + 1} z {images.length})
            </DialogTitle>
          </DialogHeader>

          <div
            className="relative h-[55vh] sm:h-[68vh] w-full bg-black/95 flex items-center justify-center overflow-hidden touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 0 && (
              <img
                src={images[activeIndex]}
                alt={title}
                referrerPolicy="no-referrer"
                onError={() => onImageError?.(images[activeIndex])}
                className="h-full w-full object-contain select-none"
              />
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Poprzednie zdjęcie"
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Następne zdjęcie"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-md hover:bg-black/80 transition cursor-pointer"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* Modal Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 bg-zinc-900/70 border-t border-zinc-800/80">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  ref={(el) => {
                    thumbnailRefs.current[idx] = el
                  }}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative aspect-[4/3] w-16 sm:w-20 shrink-0 overflow-hidden rounded-lg border-2 transition cursor-pointer ${
                    idx === activeIndex
                      ? 'border-primary ring-2 ring-primary/40 scale-105 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-90'
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
