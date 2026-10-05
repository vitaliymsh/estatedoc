import { useState, useEffect, lazy, Suspense } from 'react'
import { Header } from '@/components/Header'
import { OfferGrid } from '@/components/OfferGrid'
import { Pagination } from '@/components/Pagination'
import { FilterModal } from '@/components/FilterModal'
import { DevIntakeFab } from '@/components/DevIntakeFab'
import { Skeleton } from '@/components/ui/skeleton'
import { useOffers, PAGE_SIZE } from '@/hooks/use-offers'
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

  const handleSelectOffer = (id: number) => {
    setSelectedOfferId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('offerId', String(id))
    window.history.pushState({ offerId: id }, '', url.toString())
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToList = () => {
    setSelectedOfferId(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('offerId')
    window.history.pushState(null, '', url.toString())
  }

  const activeFiltersCount =
    (filter.prompt ? 1 : 0) +
    (filter.city ? 1 : 0) +
    (filter.portal ? 1 : 0) +
    (filter.minPrice !== undefined ? 1 : 0) +
    (filter.maxPrice !== undefined ? 1 : 0) +
    (filter.sortBy !== 'newest' ? 1 : 0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        filter={filter}
        searchInput={searchInput}
        onSearchChange={(val) => {
          if (selectedOfferId !== null) {
            setSelectedOfferId(null)
            const url = new URL(window.location.href)
            url.searchParams.delete('offerId')
            window.history.pushState(null, '', url.toString())
          }
          handleSearchChange(val)
        }}
        onSearchSubmit={(val) => {
          if (selectedOfferId !== null) {
            setSelectedOfferId(null)
            const url = new URL(window.location.href)
            url.searchParams.delete('offerId')
            window.history.pushState(null, '', url.toString())
          }
          handleSearchSubmit(val)
        }}
        onClearSearch={handleClearSearch}
        onCitySelect={(city) => {
          setSelectedOfferId(null)
          setFilter((prev) => ({ ...prev, city, page: 1 }))
        }}
        onSortChange={(sortBy: SortBy) => {
          setFilter((prev) => ({ ...prev, sortBy, page: 1 }))
        }}
        onOpenFilterModal={() => setIsFilterModalOpen(true)}
        activeFiltersCount={activeFiltersCount}
        showFilters={selectedOfferId === null}
      />

      {selectedOfferId !== null ? (
        <main>
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
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* AI Extracted Filters Feedback */}
          {parsedFilters && Object.keys(parsedFilters).length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              <span className="font-semibold">AI Rozpoznane kryteria:</span>
              {parsedFilters.city ? <span>Miasto: <strong>{String(parsedFilters.city)}</strong></span> : null}
              {parsedFilters.district ? <span>Dzielnica: <strong>{String(parsedFilters.district)}</strong></span> : null}
              {parsedFilters.minRooms || parsedFilters.maxRooms ? (
                <span>
                  Pokoje: <strong>{parsedFilters.minRooms === parsedFilters.maxRooms ? String(parsedFilters.minRooms) : `${parsedFilters.minRooms ?? 1}-${parsedFilters.maxRooms ?? 'dowolnie'}`}</strong>
                </span>
              ) : null}
              {parsedFilters.maxPrice ? <span>Max cena: <strong>{Number(parsedFilters.maxPrice).toLocaleString('pl-PL')} zł</strong></span> : null}
              {parsedFilters.minPrice ? <span>Min cena: <strong>{Number(parsedFilters.minPrice).toLocaleString('pl-PL')} zł</strong></span> : null}
              {parsedFilters.q ? <span>Słowa: <strong>{String(parsedFilters.q)}</strong></span> : null}
            </div>
          )}

          {/* Stats Row */}
          <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {loading ? (
                'Wyszukiwanie ofert...'
              ) : (
                <>
                  Znaleziono <strong className="text-foreground">{total}</strong> {total === 1 ? 'ofertę' : 'ofert'}
                  {filter.city ? ` w: ${filter.city}` : ''}
                </>
              )}
            </p>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-primary underline underline-offset-2 hover:opacity-80 cursor-pointer"
              >
                Wyczyść filtry
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
            onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
          />
        </main>
      )}

      <FilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filter={filter}
        onApply={(draft: Partial<ListOffersFilter>) =>
          setFilter((prev) => ({ ...prev, ...draft }))
        }
      />

      <DevIntakeFab isSyncing={isSyncing} onSync={triggerSync} />
    </div>
  )
}
