import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ListOffersFilter, SortBy } from '../types/offer'

const PORTALS = ['sprzedajemy', 'otodom', 'olx', 'gratka']

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filter: ListOffersFilter
  onApply: (draft: Partial<ListOffersFilter>) => void
}

export function FilterModal({ open, onOpenChange, filter, onApply }: FilterModalProps) {
  const [city, setCity] = useState(filter.city || '')
  const [portal, setPortal] = useState(filter.portal || '')
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() || '')
  const [sortBy, setSortBy] = useState<SortBy>(filter.sortBy)

  useEffect(() => {
    if (open) {
      setCity(filter.city || '')
      setPortal(filter.portal || '')
      setMinPrice(filter.minPrice?.toString() || '')
      setMaxPrice(filter.maxPrice?.toString() || '')
      setSortBy(filter.sortBy)
    }
  }, [open, filter])

  const handleApply = () => {
    onApply({
      city: city.trim() || undefined,
      portal: portal || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      page: 1,
    })
    onOpenChange(false)
  }

  const handleClear = () => {
    setCity('')
    setPortal('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtry</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* City Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Miasto</label>
            <Input
              placeholder="np. Warszawa, Kraków"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Portal Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Portal</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPortal('')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  !portal
                    ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Wszystkie
              </button>
              {PORTALS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPortal(portal === p ? '' : p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                    portal === p
                      ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Zakres cenowy (PLN)</label>
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
          </div>

          {/* Sort Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Sortowanie</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSortBy('newest')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sortBy === 'newest'
                    ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Najnowsze
              </button>
              <button
                type="button"
                onClick={() => setSortBy('price_asc')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sortBy === 'price_asc'
                    ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Cena: rosnąco
              </button>
              <button
                type="button"
                onClick={() => setSortBy('price_desc')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sortBy === 'price_desc'
                    ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Cena: malejąco
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Wyczyść
          </Button>
          <Button size="sm" onClick={handleApply}>
            Pokaż oferty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
