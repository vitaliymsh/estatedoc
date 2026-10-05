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
import { Search, SlidersHorizontal, X, ArrowUpDown, RefreshCw } from 'lucide-react'
import type { ListOffersFilter, SortBy } from '../types/offer'

const QUICK_CITIES = ['Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź']

interface HeaderProps {
  filter: ListOffersFilter
  searchInput: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  onCitySelect: (city?: string) => void
  onSortChange: (sortBy: SortBy) => void
  onOpenFilterModal: () => void
  activeFiltersCount: number
  isSyncing?: boolean
  onSync?: () => void
}

export function Header({
  filter,
  searchInput,
  onSearchChange,
  onClearSearch,
  onCitySelect,
  onSortChange,
  onOpenFilterModal,
  activeFiltersCount,
  isSyncing = false,
  onSync,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-primary">EstatePlanner</h1>
          {onSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="h-7 gap-1.5 rounded-full text-xs px-2.5 font-medium cursor-pointer"
              title="Pobierz nowe oferty ze scrapera"
            >
              <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Pobieranie...' : 'Pobierz oferty'}</span>
            </Button>
          )}
        </div>

        {/* Airbnb Center Search Capsule */}
        <div className="relative flex w-full max-w-md items-center rounded-full border bg-muted/30 px-3 py-1.5 shadow-xs transition hover:shadow-md focus-within:ring-2 focus-within:ring-ring sm:w-80 md:w-96">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Szukaj miasta, tytułu, opisu..."
            className="h-7 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
          />
          {searchInput && (
            <button
              type="button"
              onClick={onClearSearch}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Wyczyść"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips Horizontal Scrollbar */}
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
    </header>
  )
}
