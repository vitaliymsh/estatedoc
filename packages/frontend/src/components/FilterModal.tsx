import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import type { ListOffersFilter, SortBy } from '../types/offer'

const PORTALS = ['morizon', 'sprzedajemy', 'otodom', 'olx', 'gratka']
const SLIDER_MIN = 0
const SLIDER_MAX = 3000000
const SLIDER_STEP = 25000

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filter: ListOffersFilter
  onApply: (draft: Partial<ListOffersFilter>) => void
}

function FilterForm({
  filter,
  onApply,
}: {
  filter: ListOffersFilter
  onApply: (draft: Partial<ListOffersFilter>) => void
}) {
  const [city, setCity] = useState(filter.city || '')
  const [portal, setPortal] = useState(filter.portal || '')
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() || '')
  const [sortBy, setSortBy] = useState<SortBy>(filter.sortBy)

  const handleApply = () => {
    onApply({
      city: city.trim() || undefined,
      portal: portal || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      page: 1,
    })
  }

  const handleClear = () => {
    setCity('')
    setPortal('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  const sliderValue = [
    minPrice ? Math.max(SLIDER_MIN, Math.min(Number(minPrice), SLIDER_MAX)) : SLIDER_MIN,
    maxPrice ? Math.max(SLIDER_MIN, Math.min(Number(maxPrice), SLIDER_MAX)) : SLIDER_MAX,
  ]

  const handleSliderChange = (val: number | readonly number[]) => {
    if (Array.isArray(val) && val.length >= 2) {
      setMinPrice(val[0] > SLIDER_MIN ? String(val[0]) : '')
      setMaxPrice(val[1] < SLIDER_MAX ? String(val[1]) : '')
    }
  }

  return (
    <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col justify-between p-6">
      <div>
        <SheetHeader className="p-0 pb-4 border-b">
          <SheetTitle>Filtry</SheetTitle>
          <SheetDescription className="sr-only">
            Dostosuj kryteria wyszukiwania nieruchomości
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* City Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Miasto</Label>
            <Input
              placeholder="np. Warszawa, Kraków"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Portal Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Portal</Label>
            <ToggleGroup
              value={portal ? [portal] : ['all']}
              onValueChange={(val) => {
                const selected = val[val.length - 1]
                if (!selected || selected === 'all') {
                  setPortal('')
                } else {
                  setPortal(selected)
                }
              }}
              className="flex flex-wrap gap-2"
            >
              <ToggleGroupItem
                value="all"
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
              >
                Wszystkie
              </ToggleGroupItem>
              {PORTALS.map((p) => (
                <ToggleGroupItem
                  key={p}
                  value={p}
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium capitalize cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
                >
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Zakres cenowy (PLN)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-muted-foreground">Od</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Do</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="Bez limitu"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2 px-1">
              <Slider
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={sliderValue}
                onValueChange={handleSliderChange}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground pt-1.5">
                <span>0 PLN</span>
                <span>1.5M PLN</span>
                <span>3M+ PLN</span>
              </div>
            </div>
          </div>

          {/* Sort Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Sortowanie</Label>
            <ToggleGroup
              value={[sortBy]}
              onValueChange={(val) => {
                const selected = val[val.length - 1]
                if (selected) {
                  setSortBy(selected as SortBy)
                }
              }}
              className="flex flex-wrap gap-2"
            >
              <ToggleGroupItem
                value="newest"
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
              >
                Najnowsze
              </ToggleGroupItem>
              <ToggleGroupItem
                value="price_asc"
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
              >
                Cena: rosnąco
              </ToggleGroupItem>
              <ToggleGroupItem
                value="price_desc"
                size="sm"
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground aria-pressed:ring-1 aria-pressed:ring-border"
              >
                Cena: malejąco
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <SheetFooter className="p-0 pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Wyczyść
        </Button>
        <Button size="sm" onClick={handleApply}>
          Pokaż oferty
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}

export function FilterModal({ open, onOpenChange, filter, onApply }: FilterModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FilterForm
          filter={filter}
          onApply={(draft) => {
            onApply(draft)
            onOpenChange(false)
          }}
        />
      ) : null}
    </Sheet>
  )
}
