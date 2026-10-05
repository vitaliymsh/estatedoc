import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/Header'
import { OfferGrid } from '@/components/OfferGrid'
import { Pagination } from '@/components/Pagination'
import { FilterModal } from '@/components/FilterModal'
import { OfferDetailPage } from '@/components/OfferDetailPage'
import { useOffers, PAGE_SIZE } from '@/hooks/use-offers'
import type { ListOffersFilter, SortBy } from '@/types/offer'

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
    handleSearchChange,
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

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filter.city) count++
    if (filter.portal) count++
    if (filter.minPrice !== undefined) count++
    if (filter.maxPrice !== undefined) count++
    if (filter.sortBy !== 'newest') count++
    return count
  }, [filter])

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
        isSyncing={isSyncing}
        onSync={() => triggerSync(1)}
        showFilters={selectedOfferId === null}
      />

      {selectedOfferId !== null ? (
        <main>
          <OfferDetailPage offerId={selectedOfferId} onBack={handleBackToList} />
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
    </div>
  )
}
