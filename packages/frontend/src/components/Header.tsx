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
import { SlidersHorizontal, X, ArrowUpDown, Sparkles, Search } from 'lucide-react'
import { DocplannerIcon } from './icons/DocplannerIcon'
import { cn } from '@/lib/utils'
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(Boolean(searchInput))
  const inputRef = useRef<HTMLInputElement>(null)

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

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Brand Icon + Collapsible Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <DocplannerIcon className="h-6 w-auto shrink-0" />
          <h1
            className={cn(
              "text-xl font-black tracking-tight text-primary transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              isMobileSearchOpen ? "max-w-0 opacity-0 sm:max-w-none sm:opacity-100" : "max-w-40 opacity-100"
            )}
          >
            EstateDOC
          </h1>
        </div>

        {/* Collapsed Search Button on Mobile */}
        {!isMobileSearchOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleOpenSearch}
            className="size-9 rounded-full sm:hidden text-muted-foreground hover:text-foreground"
            aria-label="Szukaj"
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
            placeholder="Szukaj np. 3 pokoje do 600k Kraków..."
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
              aria-label={searchInput ? "Wyczyść" : "Zamknij"}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </form>
      </div>

      {/* Quick Filter Chips Horizontal Scrollbar */}
      {showFilters && (
        <div className="border-t">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 no-scrollbar">
            {/* Filter Modal Trigger */}
            <Button
              variant={activeFiltersCount > 0 ? 'default' : 'outline'}
              size="sm"
              onClick={onOpenFilterModal}
              className="shrink-0 rounded-full gap-1.5 text-xs h-7 cursor-pointer"
            >
              <SlidersHorizontal className="size-3.5" />
              Filtry
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold bg-background text-foreground"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Separator orientation="vertical" className="h-4" />

            {/* Quick City Chips */}
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
                Wszystkie miasta
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

            <Separator orientation="vertical" className="h-4" />

            {/* Quick Sort Options */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
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
                  <SelectItem value="newest">Najnowsze</SelectItem>
                  <SelectItem value="price_asc">Cena: rosnąco</SelectItem>
                  <SelectItem value="price_desc">Cena: malejąco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
