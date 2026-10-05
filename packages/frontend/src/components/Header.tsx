import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SlidersHorizontal, X, ArrowUpDown, Sparkles, Search, Globe } from 'lucide-react'
import { DocplannerIcon } from './icons/DocplannerIcon'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import type { ListOffersFilter, SortBy } from '../types/offer'

const QUICK_CITIES = ['Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź']

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
        "sticky top-0 z-30 border-b bg-background/95 backdrop-blur transition-transform duration-300 ease-in-out",
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
              "text-xl font-black tracking-tight text-primary transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
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
            <Sparkles className="size-4 text-primary shrink-0 animate-pulse" />
            <Input
              ref={inputRef}
              type="text"
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
          <span>{lang.toUpperCase()}</span>
        </Button>
      </div>

      {/* Quick Filter Bar */}
      {showFilters && (
        <div className="border-t">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
            {/* Action Row on Mobile, Flex Inline on Desktop */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              {/* Filter Modal Trigger */}
              <Button
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={onOpenFilterModal}
                className="shrink-0 rounded-full gap-1.5 text-xs h-7 cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5" />
                {t('filters')}
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold bg-background text-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Quick Sort on Mobile */}
              <div className="flex sm:hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="size-3" />
                <Select
                  value={filter.sortBy}
                  onValueChange={(val) => {
                    if (val) onSortChange(val as SortBy)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 border-none bg-transparent shadow-none text-xs font-medium text-foreground px-1 gap-1 focus-visible:ring-0 cursor-pointer"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="newest">{t('sort_newest')}</SelectItem>
                    <SelectItem value="price_asc">{t('sort_price_asc')}</SelectItem>
                    <SelectItem value="price_desc">{t('sort_price_desc')}</SelectItem>
                    <SelectItem value="price_sqm_asc">{t('sort_price_sqm_asc')}</SelectItem>
                    <SelectItem value="price_sqm_desc">{t('sort_price_sqm_desc')}</SelectItem>
                    <SelectItem value="area_asc">{t('sort_area_asc')}</SelectItem>
                    <SelectItem value="area_desc">{t('sort_area_desc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-4 shrink-0" />

            {/* Quick City Chips */}
            <div className="flex items-center overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 flex-1">
              <ToggleGroup
                value={filter.city ? [filter.city] : ['all']}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  if (!selected || selected === 'all' || selected === filter.city) {
                    onCitySelect(undefined)
                  } else {
                    onCitySelect(selected)
                  }
                }}
                className="flex items-center gap-1.5 shrink-0"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('all_cities')}
                </ToggleGroupItem>
                {QUICK_CITIES.map((city) => (
                  <ToggleGroupItem
                    key={city}
                    value={city}
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
                  >
                    {city}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-4 shrink-0" />

            {/* Quick Sort Options on Desktop */}
            <div className="hidden sm:flex ml-auto shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="size-3" />
              <Select
                value={filter.sortBy}
                onValueChange={(val) => {
                  if (val) onSortChange(val as SortBy)
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-7 border-none bg-transparent shadow-none text-xs font-medium text-foreground px-1 gap-1 focus-visible:ring-0 cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">{t('sort_newest')}</SelectItem>
                  <SelectItem value="price_asc">{t('sort_price_asc')}</SelectItem>
                  <SelectItem value="price_desc">{t('sort_price_desc')}</SelectItem>
                  <SelectItem value="price_sqm_asc">{t('sort_price_sqm_asc')}</SelectItem>
                  <SelectItem value="price_sqm_desc">{t('sort_price_sqm_desc')}</SelectItem>
                  <SelectItem value="area_asc">{t('sort_area_asc')}</SelectItem>
                  <SelectItem value="area_desc">{t('sort_area_desc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
