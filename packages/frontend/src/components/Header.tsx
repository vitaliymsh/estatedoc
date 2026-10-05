import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
            className="shrink-0 rounded-full gap-1.5 text-xs h-7"
          >
            <SlidersHorizontal className="size-3.5" />
            Filtry
            {activeFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-background px-1.5 py-0.2 text-[10px] font-bold text-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <div className="h-4 w-px bg-border shrink-0" />

          {/* Quick City Chips */}
          <button
            type="button"
            onClick={() => onCitySelect(undefined)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              !filter.city
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Wszystkie miasta
          </button>
          {QUICK_CITIES.map((city) => {
            const active = filter.city?.toLowerCase() === city.toLowerCase()
            return (
              <button
                key={city}
                type="button"
                onClick={() => onCitySelect(active ? undefined : city)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {city}
              </button>
            )
          })}

          <div className="h-4 w-px bg-border shrink-0" />

          {/* Quick Sort Options */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="size-3" />
            <select
              value={filter.sortBy}
              onChange={(e) => onSortChange(e.target.value as SortBy)}
              className="bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            >
              <option value="newest">Najnowsze</option>
              <option value="price_asc">Cena: rosnąco</option>
              <option value="price_desc">Cena: malejąco</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  )
}
