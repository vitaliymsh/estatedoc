import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlidersHorizontal, X, ArrowUpDown, Sparkles, Search, Globe } from 'lucide-react'
import { DocplannerIcon } from './icons/DocplannerIcon'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { SORT_OPTIONS, type ListOffersFilter, type SortBy } from '../types/offer'

const QUICK_CITIES = [
  'Warszawa',
  'Kraków',
  'Gdańsk',
  'Wrocław',
  'Poznań',
  'Łódź',
  'Katowice',
  'Gdynia',
  'Szczecin',
  'Lublin',
  'Bydgoszcz',
]

interface HeaderProps {
  filter: ListOffersFilter
  searchInput: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: (value?: string) => void
  onClearSearch: () => void
  onCitySelect: (city?: string) => void
  onSortChange: (sortBy: SortBy) => void
  onOpenFilterModal: () => void
  activeFiltersCount: number
  showFilters?: boolean
}

export function Header({
  filter,
  searchInput,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onCitySelect,
  onSortChange,
  onOpenFilterModal,
  activeFiltersCount,
  showFilters = true,
}: HeaderProps) {
  const { t, lang, setLang } = useTranslation()
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(Boolean(searchInput))
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const diff = currentScrollY - lastScrollY.current

          if (Math.abs(diff) > 6) {
            if (currentScrollY <= 20) {
              setIsVisible(true)
            } else if (diff > 0 && currentScrollY > 80) {
              setIsVisible(false)
            } else if (diff < 0) {
              setIsVisible(true)
            }
            lastScrollY.current = currentScrollY
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isMobileSearchOpen) {
      inputRef.current?.focus()
    }
  }, [isMobileSearchOpen])

  const handleOpenSearch = () => {
    setIsMobileSearchOpen(true)
  }

  const handleCloseSearch = () => {
    if (searchInput) {
      onClearSearch()
    }
    setIsMobileSearchOpen(false)
  }

  const showHeader = isVisible || isMobileSearchOpen

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md transition-transform duration-300 ease-in-out shadow-2xs",
        showHeader ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Brand Icon + Collapsible Title */}
        <a
          href="/"
          className="flex items-center gap-2.5 shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-0.5 hover:opacity-90 transition-opacity"
          aria-label={t('brand_aria')}
        >
          <DocplannerIcon className="h-6 w-auto shrink-0" />
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight text-primary transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              isMobileSearchOpen ? "max-w-0 opacity-0 sm:max-w-none sm:opacity-100" : "max-w-40 opacity-100"
            )}
          >
            EstateDOC
          </h1>
        </a>

        <div className="flex items-center gap-2 flex-1 justify-end sm:justify-center">
          {/* Collapsed Search Button on Mobile */}
          {!isMobileSearchOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleOpenSearch}
              className="size-9 rounded-full sm:hidden text-muted-foreground hover:text-foreground"
              aria-label={t('search_aria')}
            >
              <Search className="size-4" />
            </Button>
          )}

          {/* Search Capsule (Expanding on Mobile, Fixed Capsule on Desktop) */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSearchSubmit?.(searchInput)
            }}
            className={cn(
              "relative h-9 items-center rounded-full border bg-muted/30 px-3 shadow-xs transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-ring sm:flex sm:w-80 md:w-96",
              isMobileSearchOpen ? "flex flex-1" : "hidden sm:flex"
            )}
          >
            <button
              type="submit"
              aria-label={t('search_aria')}
              className="flex items-center justify-center p-0 text-primary hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            >
              <div className="animate-pulse flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
            </button>
            <Input
              ref={inputRef}
              type="text"
              enterKeyHint="search"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCloseSearch()
                }
              }}
              placeholder={t('search_placeholder')}
              className="h-full border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
            />
            {(searchInput || isMobileSearchOpen) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  if (searchInput) {
                    onClearSearch()
                  } else {
                    setIsMobileSearchOpen(false)
                  }
                }}
                className={cn(
                  "rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground",
                  !searchInput && "sm:hidden"
                )}
                aria-label={searchInput ? t('clear_aria') : t('close_aria')}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </form>
        </div>

        {/* Language Switcher */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLang(lang === 'pl' ? 'en' : 'pl')}
          className="h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold gap-1.5 cursor-pointer border-border hover:bg-muted"
          aria-label={lang === 'pl' ? 'Switch language to English' : 'Przełącz język na polski'}
        >
          <Globe className="size-3.5 text-muted-foreground" />
          <span>{(lang === 'en' ? 'pl' : 'en').toUpperCase()}</span>
        </Button>
      </div>

      {/* Quick Filter Bar */}
      {showFilters && (
        <div>
          <div className="mx-auto max-w-7xl px-4 pb-3 pt-1 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center gap-2">
            {/* Top row on mobile (Filter + Sort). On desktop (>=md): rendered inline via md:contents */}
            <div className="flex items-center justify-between gap-2 md:contents">
              {/* Filter Modal Trigger Pill */}
              <Button
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={onOpenFilterModal}
                className={cn(
                  "order-1 shrink-0 rounded-full gap-2 text-xs h-9 px-4 border transition-all cursor-pointer shadow-2xs active:scale-[0.98]",
                  activeFiltersCount > 0
                    ? "border-foreground bg-foreground text-background font-semibold hover:bg-foreground/90 hover:text-background"
                    : "border-border/80 bg-background text-foreground hover:border-foreground"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full px-1.5 py-0.2 text-[10px] font-bold bg-background text-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              <Separator orientation="vertical" className="order-2 hidden md:block h-5 shrink-0 mx-0.5" />

              {/* Quick Sort Options: right-aligned on mobile row 1, right-aligned on desktop */}
              <div className="order-5 shrink-0 md:ml-auto flex items-center">
                <Select
                  value={filter.sortBy}
                  onValueChange={(val) => {
                    if (val) onSortChange(val as SortBy)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-9 border-border/80 rounded-full px-3.5 text-xs font-medium text-foreground gap-1.5 hover:border-foreground cursor-pointer shadow-2xs active:scale-[0.98]"
                  >
                    <ArrowUpDown className="size-3 text-muted-foreground" />
                    <SelectValue>
                      {(val: SortBy) =>
                        t(SORT_OPTIONS.find((o) => o.value === (val ?? filter.sortBy))?.labelKey ?? 'sort_newest')
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second row on mobile (All Cities + Carousel). On desktop (>=md): rendered inline via md:contents */}
            <div className="flex items-center gap-2 min-w-0 md:contents">
              {/* All Cities Chip - Constant / Pinned */}
              <button
                type="button"
                onClick={() => onCitySelect(undefined)}
                className={cn(
                  "order-3 h-9 shrink-0 rounded-full px-4 text-xs transition-all duration-150 border cursor-pointer whitespace-nowrap shadow-2xs active:scale-[0.98] flex items-center justify-center",
                  !filter.city
                    ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                    : "border-border/80 bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {t('all_cities')}
              </button>

              {/* Quick Location Chips Carousel */}
              <div className="order-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0 scroll-smooth overscroll-x-contain touch-pan-x">
                {QUICK_CITIES.map((city) => {
                  const isActive = filter.city === city
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => onCitySelect(isActive ? undefined : city)}
                      className={cn(
                        "h-9 shrink-0 rounded-full px-4 text-xs transition-all duration-150 border cursor-pointer whitespace-nowrap shadow-2xs active:scale-[0.98] flex items-center justify-center",
                        isActive
                          ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                          : "border-border/80 bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                      )}
                    >
                      {city}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
