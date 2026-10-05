import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import type { Offer } from '../types/offer'
import { OfferCard } from './OfferCard'
import { useTranslation } from '@/lib/i18n'

interface OfferGridProps {
  offers: Offer[]
  loading: boolean
  onResetFilters: () => void
  onSelectOffer?: (id: number) => void
}

const SKELETON_ITEMS = Array.from({ length: 8 })

export function OfferGrid({ offers, loading, onResetFilters, onSelectOffer }: OfferGridProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SKELETON_ITEMS.map((_, idx) => (
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
      <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Search className="size-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="mt-4 text-base font-semibold">{t('no_offers_title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('no_offers_desc')}
        </p>
        <Button variant="outline" size="sm" onClick={onResetFilters} className="mt-4">
          {t('clear_filters')}
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {offers.map((offer) => (
        <div key={offer.id} className="[content-visibility:auto] [contain-intrinsic-size:380px]">
          <OfferCard offer={offer} onSelect={onSelectOffer} />
        </div>
      ))}
    </div>
  )
}
