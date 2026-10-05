import { useState, useEffect, useCallback, useMemo, startTransition, lazy, Suspense } from 'react'
import { Header } from '@/components/Header'
import { OfferGrid } from '@/components/OfferGrid'
import { Pagination } from '@/components/Pagination'
import { IngestWorkerButton } from '@/components/IngestWorkerButton'
import { TemporaryKeyOverlay } from '@/components/TemporaryKeyOverlay'
import { Skeleton } from '@/components/ui/skeleton'
import { useOffers, PAGE_SIZE } from '@/hooks/use-offers'
import { useTranslation } from '@/lib/i18n'
import { formatPrice } from '@/lib/formatters'
import type { ListOffersFilter, SortBy } from '@/types/offer'

const FilterModal = lazy(() =>
  import('@/components/FilterModal').then((m) => ({ default: m.FilterModal }))
)

const OfferDetailPage = lazy(() =>
  import('@/components/OfferDetailPage').then((m) => ({ default: m.OfferDetailPage }))
)

const pluralRulesCache = new Map<string, Intl.PluralRules>()
function getPluralRules(lang: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(lang)
  if (!rules) {
    rules = new Intl.PluralRules(lang)
    pluralRulesCache.set(lang, rules)
  }
  return rules
}

const AMENITY_TAGS = [
  ['hasElevator', 'filter_amenity_elevator'],
  ['hasBalcony', 'filter_amenity_balcony'],
  ['hasParking', 'filter_amenity_parking'],
  ['hasAirConditioning', 'filter_amenity_ac'],
  ['isFurnished', 'filter_amenity_furnished'],
  ['hasBasement', 'filter_amenity_basement'],
] as const

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

  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(
    () => Number(new URLSearchParams(window.location.search).get('offerId')) || null
  )
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
    setSelectedOfferId((prev) => {
      if (prev === null) return null
      const url = new URL(window.location.href)
      url.searchParams.delete('offerId')
      window.history.pushState(null, '', url.toString())
      return null
    })
  }, [])

  const handleHeaderSearchChange = useCallback(
    (val: string) => {
      handleBackToList()
      handleSearchChange(val)
    },
    [handleBackToList, handleSearchChange]
  )

  const handleHeaderSearchSubmit = useCallback(
    (val?: string) => {
      handleBackToList()
      startTransition(() => handleSearchSubmit(val))
    },
    [handleBackToList, handleSearchSubmit]
  )

  const handleCitySelect = useCallback(
    (city: string | undefined) => {
      handleBackToList()
      startTransition(() => setFilter((prev) => ({ ...prev, city, page: 1 })))
    },
    [handleBackToList, setFilter]
  )

  const handleSortChange = useCallback(
    (sortBy: SortBy) => {
      startTransition(() => setFilter((prev) => ({ ...prev, sortBy, page: 1 })))
    },
    [setFilter]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => setFilter((prev) => ({ ...prev, page })))
    },
    [setFilter]
  )

  const effectiveFilter = useMemo(
    () => (filter.prompt && parsedFilters ? ({ ...filter, ...parsedFilters } as ListOffersFilter) : filter),
    [filter, parsedFilters]
  )

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

  const handleOpenFilterModal = useCallback(() => setIsFilterModalOpen(true), [])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    const f = effectiveFilter
    if (f.city) count++
    if (f.district) count++
    if (f.portal) count++
    if (f.transactionType) count++
    if (f.propertyType) count++
    if (f.sellerType) count++
    if (f.marketType) count++
    if (f.minPrice !== undefined) count++
    if (f.maxPrice !== undefined) count++
    if (f.minArea !== undefined) count++
    if (f.maxArea !== undefined) count++
    if (f.minRooms !== undefined || f.maxRooms !== undefined) count++
    if (f.minFloor !== undefined || f.maxFloor !== undefined) count++
    if (f.hasElevator) count++
    if (f.hasBalcony) count++
    if (f.hasParking) count++
    if (f.hasAirConditioning) count++
    if (f.isFurnished) count++
    if (f.hasBasement) count++
    if (f.sortBy && f.sortBy !== 'newest') count++
    if (!parsedFilters && f.prompt) count++
    return count
  }, [effectiveFilter, parsedFilters])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const getOffersUnit = (count: number) => {
    const rule = getPluralRules(lang).select(count)
    return rule === 'one' ? t('unit_offers_1') : rule === 'few' ? t('unit_offers_2_4') : t('unit_offers_other')
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
        onOpenFilterModal={handleOpenFilterModal}
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
              {AMENITY_TAGS.map(([key, labelKey]) =>
                parsedFilters[key] ? (
                  <span key={key} className="rounded bg-primary/10 px-1.5 py-0.5">
                    {t(labelKey)}
                  </span>
                ) : null
              )}
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
                  <strong className="text-foreground">{total}</strong> {getOffersUnit(total)}
                  {filter.city ? t('in_city', { city: filter.city }) : ''}
                </>
              )}
            </p>

            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                {t('clear_filters')}
              </button>
            ) : null}
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

      {isFilterModalOpen ? (
        <Suspense fallback={null}>
          <FilterModal
            open={isFilterModalOpen}
            onOpenChange={setIsFilterModalOpen}
            filter={filter}
            parsedFilters={parsedFilters}
            onApply={handleFilterApply}
          />
        </Suspense>
      ) : null}

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
