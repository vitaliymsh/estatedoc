import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, RefreshCw } from 'lucide-react'
import type { Offer } from '../types/offer'
import { formatPrice, formatPricePerSqm, buildGoogleMapsUrl } from '../lib/formatters'
import {
  resolveOfferCoordinates,
  extractCoordinates,
  getEffectiveLocation,
  type Coordinates,
} from '../lib/geocoding'
import { Button } from '@/components/ui/button'
import { useTranslation, type Language } from '@/lib/i18n'

export interface ListingMapProps {
  offer?: Partial<Offer> | null
  zoom?: number
  height?: string | number
  className?: string
  interactive?: boolean
  showControls?: boolean
  showPopup?: boolean
}

const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ'

function createMarkerIcon(priceText: string, isSelected = false): L.DivIcon {
  return L.divIcon({
    className: 'leaflet-custom-badge-icon',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
        <div class="absolute -bottom-1 size-5 rounded-full bg-primary/20 animate-ping pointer-events-none"></div>
        <div class="relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg ${
          isSelected
            ? 'bg-neutral-900 ring-2 ring-amber-400 dark:bg-neutral-900'
            : 'bg-neutral-900 ring-2 ring-white/90 dark:bg-neutral-900 dark:ring-neutral-700'
        }">
          <svg class="size-3.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span class="whitespace-nowrap tracking-tight font-semibold">${priceText}</span>
        </div>
        <div class="size-2 -mt-1 rotate-45 shadow-xs ${
          isSelected ? 'bg-neutral-900 ring-1 ring-amber-400/50' : 'bg-neutral-900 ring-1 ring-white/40 dark:bg-neutral-900'
        }"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
  })
}

export function ListingMap({
  offer,
  zoom = 14,
  height = '380px',
  className = '',
  interactive = true,
  showControls = true,
  showPopup = true,
}: ListingMapProps) {
  const { lang } = useTranslation()

  const containerRef = useRef<HTMLDivElement | null>(null)

  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const directCoords = offer ? extractCoordinates(offer) : null
  const [asyncCoords, setAsyncCoords] = useState<Coordinates | null>(null)
  const [isLoadingCoords, setIsLoadingCoords] = useState<boolean>(() => !directCoords && Boolean(offer))

  const resolvedCoords = directCoords || asyncCoords
  const lat = resolvedCoords?.lat
  const lng = resolvedCoords?.lng

  // 1. Resolve coordinates asynchronously when direct coordinates not present
  useEffect(() => {
    if (directCoords || !offer) return

    let isMounted = true
    setIsLoadingCoords(true)

    resolveOfferCoordinates(offer).then((coords) => {
      if (isMounted) {
        setAsyncCoords(coords)
        setIsLoadingCoords(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [offer, directCoords])

  // 2. Initialize and manage Leaflet Map lifecycle
  useEffect(() => {
    if (!containerRef.current || lat == null || lng == null) return

    let resizeTimer: ReturnType<typeof setTimeout> | null = null

    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        touchZoom: interactive,
        doubleClickZoom: interactive,
      })

      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: TILE_ATTRIBUTION,
      }).addTo(map)

      markersLayerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map

      resizeTimer = setTimeout(() => {
        map.invalidateSize()
      }, 150)
    } else {
      mapInstanceRef.current.setView([lat, lng], zoom, {
        animate: true,
      })
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersLayerRef.current = null
      }
    }
  }, [lat, lng, zoom, interactive])

  // 3. Render marker
  const offerId = offer?.id
  const offerPrice = offer?.price
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersGroup = markersLayerRef.current
    if (!map || !markersGroup || !offer || lat == null || lng == null || !resolvedCoords) return

    markersGroup.clearLayers()

    const priceLabel = formatPrice(offerPrice ?? null, lang)
    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(priceLabel, true),
    })

    if (showPopup) {
      marker.bindPopup(buildPopupHtml(offer, resolvedCoords, lang), {
        autoPan: true,
        autoPanPadding: [28, 28],
        maxWidth: 280,
        minWidth: 240,
        closeButton: false,
      })
    }

    markersGroup.addLayer(marker)
  }, [offerId, offerPrice, lat, lng, showPopup, lang])

  const handleRecenter = () => {
    if (mapInstanceRef.current && resolvedCoords) {
      mapInstanceRef.current.setView([resolvedCoords.lat, resolvedCoords.lng], zoom, {
        animate: true,
      })
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-xs group/map ${className}`}
      style={height ? { height } : undefined}
    >
      {/* Map Container */}
      <div
        ref={containerRef}
        className="h-full w-full z-0 font-sans"
        aria-label={lang === 'en' ? 'Interactive location map' : 'Interaktywna mapa lokalizacji'}
      />

      {/* Loading Overlay */}
      {isLoadingCoords && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="flex items-center gap-2 rounded-xl bg-background/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-md border">
            <div className="animate-spin inline-flex shrink-0">
              <RefreshCw className="size-3.5 text-primary" />
            </div>
            <span>{lang === 'en' ? 'Loading location...' : 'Wczytywanie lokalizacji...'}</span>
          </div>
        </div>
      )}

      {/* Map Recenter Control */}
      {showControls && resolvedCoords && (
        <div className="absolute top-3 right-3 z-10 pointer-events-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRecenter}
            title={lang === 'en' ? 'Center map' : 'Wycentruj mapę'}
            className="size-8 p-0 rounded-xl bg-background/90 shadow-md backdrop-blur-md hover:bg-background cursor-pointer"
          >
            <Navigation className="size-3.5 text-foreground" />
          </Button>
        </div>
      )}
    </div>
  )
}


function buildPopupHtml(item: Partial<Offer>, coords: Coordinates, lang: Language = 'pl'): string {
  const price = formatPrice(item.price ?? null, lang)
  const priceSqm = formatPricePerSqm(item.pricePerSqm ?? null, lang)
  const effectiveLoc = getEffectiveLocation(item)
  const district = effectiveLoc.district
  const street = effectiveLoc.street
  const city = effectiveLoc.city
  const thumbnail = item.images?.[0]
  const locationText = [street ? `ul. ${street}` : null, district, city]
    .filter(Boolean)
    .join(', ')
  const gmapsUrl = city
    ? buildGoogleMapsUrl(city, district, street)
    : `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`

  return `
    <div class="overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans shadow-xl w-[260px]">
      ${
        thumbnail
          ? `<div class="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <img src="${thumbnail}" alt="" class="h-full w-full object-cover" />
            </div>`
          : ''
      }
      <div class="p-3.5 space-y-2">
        <div class="flex items-baseline justify-between gap-1.5">
          <span class="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">${price}</span>
          ${priceSqm ? `<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">${priceSqm}</span>` : ''}
        </div>
        ${
          item.title
            ? `<div class="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-snug">${item.title}</div>`
            : ''
        }
        <div class="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
          <svg class="size-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span class="truncate">${locationText}</span>
        </div>
        <a
          href="${gmapsUrl}"
          target="_blank"
          rel="noreferrer"
          class="leaflet-popup-btn flex items-center justify-center gap-1.5 w-full rounded-xl px-3 py-2 text-xs font-semibold shadow-xs transition mt-2.5 cursor-pointer"
        >
          <span style="color: inherit;">${lang === 'en' ? 'Navigate in Google Maps' : 'Nawiguj w Google Maps'}</span>
          <svg class="size-3.5 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 7h10v10"/>
            <path d="M7 17 17 7"/>
          </svg>
        </a>
      </div>
    </div>
  `
}
