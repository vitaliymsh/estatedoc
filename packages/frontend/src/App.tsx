import { useState, useEffect, useCallback, useMemo, startTransition, lazy, Suspense } from 'react'
import { Header } from '@/components/Header'
import { OfferGrid } from '@/components/OfferGrid'
import { Pagination } from '@/components/Pagination'
import { FilterModal } from '@/components/FilterModal'
import { IngestWorkerButton } from '@/components/IngestWorkerButton'
import { TemporaryKeyOverlay } from '@/components/TemporaryKeyOverlay'
import { Skeleton } from '@/components/ui/skeleton'
import { useOffers, PAGE_SIZE } from '@/hooks/use-offers'
import { useTranslation } from '@/lib/i18n'
import { formatPrice } from '@/lib/formatters'
import type { ListOffersFilter, SortBy } from '@/types/offer'

const OfferDetailPage = lazy(() =>
  import('@/components/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage }))
)

function getInitialOfferId(): number | null {
  if (typeof window === 'undefined') return null
  const param = new URLSearchParams(window.location.search).get('offerId')
  const num = Number(param)
  return num > 0 ? num : null
}

export default function App() {
  const { t, lang } = useTranslation()
  const {
    filter,
    setFilter,
    searchInput,
    parsedFilters,
    handleSearchChange,
    handleSearchSubmit,
    handleClearSearch,
    offers,
    total,
    loading,
    isSyncing,
    triggerSync,
    resetFilters,
    isKeyRequired,
    isVerifyingKey,
    keyError,
    handleSetTemporaryKey,
  } = useOffers()

  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(getInitialOfferId)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentParam = new URLSearchParams(window.location.search).get('offerId')
      const num = Number(currentParam)
      setSelectedOfferId(num > 0 ? num : null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleSelectOffer = useCallback((id: number) => {
    setSelectedOfferId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('offerId', String(id))
    window.history.pushState({ offerId: id }, '', url.toString())
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedOfferId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('offerId')
    window.history.pushState(null, '', url.toString())
  }, [])

  const handleHeaderSearchChange = useCallback(
    (val: string) => {
      if (selectedOfferId !== null) {
        setSelectedOfferId(null)
        const url = new URL(window.location.href)
        url.searchParams.delete('offerId')
        window.history.pushState(null, '', url.toString())
      }
      handleSearchChange(val)
    },
    [selectedOfferId, handleSearchChange]
  )

  const handleHeaderSearchSubmit = useCallback(
    (val?: string) => {
      if (selectedOfferId !== null) {
        setSelectedOfferId(null)
        const url = new URL(window.location.href)
        url.searchParams.delete('offerId')
        window.history.pushState(null, '', url.toString())
      }
      startTransition(() => {
        handleSearchSubmit(val)
      })
    },
    [selectedOfferId, handleSearchSubmit]
  )

  const handleCitySelect = useCallback(
    (city: string | undefined) => {
      setSelectedOfferId(null)
      startTransition(() => {
        setFilter((prev) => ({ ...prev, city, page: 1 }))
      })
    },
    [setFilter]
  )

  const handleSortChange = useCallback(
    (sortBy: SortBy) => {
      startTransition(() => {
        setFilter((prev) => ({ ...prev, sortBy, page: 1 }))
      })
    },
    [setFilter]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        setFilter((prev) => ({ ...prev, page }))
      })
    },
    [setFilter]
  )

  const effectiveFilter = useMemo(() => {
    if (filter.prompt && parsedFilters) {
      return {
        ...filter,
        city: (parsedFilters.city as string) ?? filter.city,
        district: (parsedFilters.district as string) ?? filter.district,
        propertyType: (parsedFilters.propertyType as ListOffersFilter['propertyType']) ?? filter.propertyType,
        transactionType: (parsedFilters.transactionType as ListOffersFilter['transactionType']) ?? filter.transactionType,
        minPrice: (parsedFilters.minPrice as number) ?? filter.minPrice,
        maxPrice: (parsedFilters.maxPrice as number) ?? filter.maxPrice,
        minArea: (parsedFilters.minArea as number) ?? filter.minArea,
        maxArea: (parsedFilters.maxArea as number) ?? filter.maxArea,
        minRooms: (parsedFilters.minRooms as number) ?? filter.minRooms,
        maxRooms: (parsedFilters.maxRooms as number) ?? filter.maxRooms,
        minFloor: (parsedFilters.minFloor as number) ?? filter.minFloor,
        maxFloor: (parsedFilters.maxFloor as number) ?? filter.maxFloor,
        sellerType: (parsedFilters.sellerType as ListOffersFilter['sellerType']) ?? filter.sellerType,
        marketType: (parsedFilters.marketType as ListOffersFilter['marketType']) ?? filter.marketType,
        hasElevator: (parsedFilters.hasElevator as boolean) ?? filter.hasElevator,
        hasBalcony: (parsedFilters.hasBalcony as boolean) ?? filter.hasBalcony,
        hasParking: (parsedFilters.hasParking as boolean) ?? filter.hasParking,
        hasAirConditioning: (parsedFilters.hasAirConditioning as boolean) ?? filter.hasAirConditioning,
        isFurnished: (parsedFilters.isFurnished as boolean) ?? filter.isFurnished,
        hasBasement: (parsedFilters.hasBasement as boolean) ?? filter.hasBasement,
        sortBy: (parsedFilters.sortBy as SortBy) ?? filter.sortBy,
        q: (parsedFilters.q as string) ?? filter.q,
      } as ListOffersFilter
    }
    return filter
  }, [filter, parsedFilters])

  const handleFilterApply = useCallback(
    (draft: Partial<ListOffersFilter>) => {
      startTransition(() => {
        setFilter({
          ...draft,
          prompt: undefined,
          page: 1,
          sortBy: draft.sortBy || 'newest',
        })
      })
    },
    [setFilter]
  )

  const activeFiltersCount = useMemo(
    () =>
      (effectiveFilter.city ? 1 : 0) +
      (effectiveFilter.district ? 1 : 0) +
      (effectiveFilter.portal ? 1 : 0) +
      (effectiveFilter.transactionType ? 1 : 0) +
      (effectiveFilter.propertyType ? 1 : 0) +
      (effectiveFilter.sellerType ? 1 : 0) +
      (effectiveFilter.marketType ? 1 : 0) +
      (effectiveFilter.minPrice !== undefined ? 1 : 0) +
      (effectiveFilter.maxPrice !== undefined ? 1 : 0) +
      (effectiveFilter.minArea !== undefined ? 1 : 0) +
      (effectiveFilter.maxArea !== undefined ? 1 : 0) +
      (effectiveFilter.minRooms !== undefined || effectiveFilter.maxRooms !== undefined ? 1 : 0) +
      (effectiveFilter.minFloor !== undefined || effectiveFilter.maxFloor !== undefined ? 1 : 0) +
      (effectiveFilter.hasElevator ? 1 : 0) +
      (effectiveFilter.hasBalcony ? 1 : 0) +
      (effectiveFilter.hasParking ? 1 : 0) +
      (effectiveFilter.hasAirConditioning ? 1 : 0) +
      (effectiveFilter.isFurnished ? 1 : 0) +
      (effectiveFilter.hasBasement ? 1 : 0) +
      (effectiveFilter.sortBy !== 'newest' ? 1 : 0) +
      (!parsedFilters && effectiveFilter.prompt ? 1 : 0),
    [effectiveFilter, parsedFilters]
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const getOffersUnit = (count: number) => {
    if (lang === 'en') return count === 1 ? t('unit_offers_1') : t('unit_offers_other')
    if (count === 1) return t('unit_offers_1')
    const lastDigit = count % 10
    const lastTwo = count % 100
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
      return t('unit_offers_2_4')
    }
    return t('unit_offers_other')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        filter={filter}
        searchInput={searchInput}
        onSearchChange={handleHeaderSearchChange}
        onSearchSubmit={handleHeaderSearchSubmit}
        onClearSearch={handleClearSearch}
        onCitySelect={handleCitySelect}
        onSortChange={handleSortChange}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
        activeFiltersCount={activeFiltersCount}
        showFilters={selectedOfferId === null}
      />

      {selectedOfferId !== null ? (
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-[420px] w-full rounded-2xl" />
              </div>
            }
          >
            <OfferDetailPage offerId={selectedOfferId} onBack={handleBackToList} />
          </Suspense>
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          {/* AI Extracted Filters Feedback */}
          {parsedFilters && Object.keys(parsedFilters).length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              <span className="font-semibold">{t('ai_filters_title')}</span>
              {parsedFilters.city ? <span>{t('city')}: <strong>{String(parsedFilters.city)}</strong></span> : null}
              {parsedFilters.district ? <span>{t('district')}: <strong>{String(parsedFilters.district)}</strong></span> : null}
              {parsedFilters.propertyType ? (
                <span>
                  {t('filter_property_type_label')}: <strong>{t(`property_${parsedFilters.propertyType}` as unknown as Parameters<typeof t>[0]) || String(parsedFilters.propertyType)}</strong>
                </span>
              ) : null}
              {parsedFilters.transactionType ? (
                <span>
                  {t('filter_transaction_label')}: <strong>{t(`transaction_${parsedFilters.transactionType}` as unknown as Parameters<typeof t>[0]) || String(parsedFilters.transactionType)}</strong>
                </span>
              ) : null}
              {parsedFilters.minRooms || parsedFilters.maxRooms ? (
                <span>
                  {t('rooms')}: <strong>{parsedFilters.minRooms === parsedFilters.maxRooms ? String(parsedFilters.minRooms) : `${parsedFilters.minRooms ?? 1}-${parsedFilters.maxRooms ?? t('rooms_any')}`}</strong>
                </span>
              ) : null}
              {parsedFilters.minArea !== undefined || parsedFilters.maxArea !== undefined ? (
                <span>
                  {t('area')}: <strong>
                    {parsedFilters.minArea && parsedFilters.maxArea
                      ? `${parsedFilters.minArea}-${parsedFilters.maxArea} ${t('unit_sqm')}`
                      : parsedFilters.minArea
                        ? `${t('from').toLowerCase()} ${parsedFilters.minArea} ${t('unit_sqm')}`
                        : `${t('to').toLowerCase()} ${parsedFilters.maxArea} ${t('unit_sqm')}`}
                  </strong>
                </span>
              ) : null}
              {parsedFilters.maxPrice ? <span>{t('max_price')}: <strong>{formatPrice(Number(parsedFilters.maxPrice), lang)}</strong></span> : null}
              {parsedFilters.minPrice ? <span>{t('min_price')}: <strong>{formatPrice(Number(parsedFilters.minPrice), lang)}</strong></span> : null}
              {parsedFilters.hasElevator ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_elevator')}</span> : null}
              {parsedFilters.hasBalcony ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_balcony')}</span> : null}
              {parsedFilters.hasParking ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_parking')}</span> : null}
              {parsedFilters.hasAirConditioning ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_ac')}</span> : null}
              {parsedFilters.isFurnished ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_furnished')}</span> : null}
              {parsedFilters.hasBasement ? <span className="rounded bg-primary/10 px-1.5 py-0.5">{t('filter_amenity_basement')}</span> : null}
              {parsedFilters.sortBy && parsedFilters.sortBy !== 'newest' ? (
                <span>{t('filter_sort_label')}: <strong>{t(`sort_${parsedFilters.sortBy}` as unknown as Parameters<typeof t>[0]) || String(parsedFilters.sortBy)}</strong></span>
              ) : null}
              {parsedFilters.q ? <span>{t('keywords')}: <strong>{String(parsedFilters.q)}</strong></span> : null}
            </div>
          ) : null}

          {/* Stats Row */}
          <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {loading ? (
                t('searching_offers')
              ) : (
                <>
                  {lang === 'en' ? (
                    <>
                      Found <strong className="text-foreground">{total}</strong> {getOffersUnit(total)}
                      {filter.city ? ` in: ${filter.city}` : ''}
                    </>
                  ) : (
                    <>
                      Znaleziono <strong className="text-foreground">{total}</strong> {getOffersUnit(total)}
                      {filter.city ? ` w: ${filter.city}` : ''}
                    </>
                  )}
                </>
              )}
            </p>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                {t('clear_filters')}
              </button>
            )}
          </div>

          <OfferGrid
            offers={offers}
            loading={loading}
            onResetFilters={resetFilters}
            onSelectOffer={handleSelectOffer}
          />

          <Pagination
            page={filter.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      )}

      <FilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filter={filter}
        parsedFilters={parsedFilters}
        onApply={handleFilterApply}
      />

      <IngestWorkerButton isSyncing={isSyncing} onSync={triggerSync} />

      <TemporaryKeyOverlay
        open={isKeyRequired}
        error={keyError}
        isVerifying={isVerifyingKey}
        onSubmit={handleSetTemporaryKey}
      />
    </div>
  )
}
