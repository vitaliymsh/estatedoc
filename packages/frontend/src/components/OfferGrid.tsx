import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import type { Offer } from '../types/offer'
import { OfferCard } from './OfferCard'

interface OfferGridProps {
  offers: Offer[]
  loading: boolean
  onResetFilters: () => void
}

export function OfferGrid({ offers, loading, onResetFilters }: OfferGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted p-4">
          <Search className="size-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="mt-4 text-base font-semibold">Brak ofert</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nie znaleziono ofert spełniających wybrane kryteria wyszukiwania.
        </p>
        <Button variant="outline" size="sm" onClick={onResetFilters} className="mt-4">
          Wyczyść wszystkie filtry
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}
