import { useState, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/lib/i18n'
import {
  SORT_OPTIONS,
  type ListOffersFilter,
  type SortBy,
  type TransactionType,
  type PropertyType,
  type SellerType,
  type MarketType,
} from '../types/offer'

const PORTALS = ['morizon', 'sprzedajemy', 'otodom', 'olx', 'gratka']
const PROPERTY_TYPES: { value: PropertyType; labelPl: string; labelEn: string }[] = [
  { value: 'apartment', labelPl: 'Mieszkanie', labelEn: 'Apartment' },
  { value: 'house', labelPl: 'Dom', labelEn: 'House' },
  { value: 'land', labelPl: 'Działka', labelEn: 'Land' },
  { value: 'commercial', labelPl: 'Lokal', labelEn: 'Commercial' },
  { value: 'garage', labelPl: 'Garaż', labelEn: 'Garage' },
]

const PRICE_PRESETS = [
  { label: '< 500k', min: '', max: '500000' },
  { label: '500k - 1M', min: '500000', max: '1000000' },
  { label: '1M - 1.5M', min: '1000000', max: '1500000' },
  { label: '1.5M - 2.5M', min: '1500000', max: '2500000' },
  { label: '2.5M+', min: '2500000', max: '' },
]

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filter: ListOffersFilter
  parsedFilters?: Record<string, unknown> | null
  onApply: (draft: Partial<ListOffersFilter>) => void
}

function FilterForm({
  filter,
  onApply,
}: {
  filter: ListOffersFilter
  onApply: (draft: Partial<ListOffersFilter>) => void
}) {
  const { t, lang } = useTranslation()
  const [transactionType, setTransactionType] = useState<TransactionType | ''>(filter.transactionType || '')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(filter.propertyType || '')
  const [city, setCity] = useState(filter.city || '')
  const [district, setDistrict] = useState(filter.district || '')
  const [portal, setPortal] = useState(filter.portal || '')
  const [minPrice, setMinPrice] = useState(filter.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(filter.maxPrice?.toString() || '')
  const [minArea, setMinArea] = useState(filter.minArea?.toString() || '')
  const [maxArea, setMaxArea] = useState(filter.maxArea?.toString() || '')
  const [rooms, setRooms] = useState<string>(
    filter.minRooms && filter.minRooms === filter.maxRooms
      ? String(filter.minRooms)
      : filter.minRooms === 5
        ? '5+'
        : 'all'
  )
  const [minFloor, setMinFloor] = useState(filter.minFloor?.toString() || '')
  const [maxFloor, setMaxFloor] = useState(filter.maxFloor?.toString() || '')
  const [marketType, setMarketType] = useState<MarketType | ''>(filter.marketType || '')
  const [sellerType, setSellerType] = useState<SellerType | ''>(filter.sellerType || '')
  const [hasElevator, setHasElevator] = useState<boolean>(Boolean(filter.hasElevator))
  const [hasBalcony, setHasBalcony] = useState<boolean>(Boolean(filter.hasBalcony))
  const [hasParking, setHasParking] = useState<boolean>(Boolean(filter.hasParking))
  const [hasAirConditioning, setHasAirConditioning] = useState<boolean>(Boolean(filter.hasAirConditioning))
  const [isFurnished, setIsFurnished] = useState<boolean>(Boolean(filter.isFurnished))
  const [hasBasement, setHasBasement] = useState<boolean>(Boolean(filter.hasBasement))
  const [sortBy, setSortBy] = useState<SortBy>(filter.sortBy)

  const handleApply = () => {
    const r = Number(rooms)
    const minRoomsVal = rooms === '5+' ? 5 : r || undefined
    const maxRoomsVal = rooms === '5+' ? undefined : minRoomsVal

    const parseRange = (minStr: string, maxStr: string) => {
      let min = minStr ? Number(minStr) : undefined
      let max = maxStr ? Number(maxStr) : undefined
      if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]
      return [min, max]
    }

    const [minP, maxP] = parseRange(minPrice, maxPrice)
    const [minA, maxA] = parseRange(minArea, maxArea)
    const [minF, maxF] = parseRange(minFloor, maxFloor)

    onApply({
      transactionType: transactionType || undefined,
      propertyType: propertyType || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      portal: portal || undefined,
      minPrice: minP,
      maxPrice: maxP,
      minArea: minA,
      maxArea: maxA,
      minRooms: minRoomsVal,
      maxRooms: maxRoomsVal,
      minFloor: minF,
      maxFloor: maxF,
      marketType: marketType || undefined,
      sellerType: sellerType || undefined,
      hasElevator: hasElevator || undefined,
      hasBalcony: hasBalcony || undefined,
      hasParking: hasParking || undefined,
      hasAirConditioning: hasAirConditioning || undefined,
      isFurnished: isFurnished || undefined,
      hasBasement: hasBasement || undefined,
      sortBy,
      page: 1,
    })
  }

  const handleClear = () => {
    setTransactionType('')
    setPropertyType('')
    setCity('')
    setDistrict('')
    setPortal('')
    setMinPrice('')
    setMaxPrice('')
    setMinArea('')
    setMaxArea('')
    setRooms('all')
    setMinFloor('')
    setMaxFloor('')
    setMarketType('')
    setSellerType('')
    setHasElevator(false)
    setHasBalcony(false)
    setHasParking(false)
    setHasAirConditioning(false)
    setIsFurnished(false)
    setHasBasement(false)
    setSortBy('newest')
  }

  return (
    <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl h-full flex flex-col justify-between p-0 gap-0">
      <SheetHeader className="p-4 sm:p-6 pb-3 border-b shrink-0">
        <SheetTitle>{t('filter_modal_title')}</SheetTitle>
        <SheetDescription className="sr-only">
          {t('filter_modal_desc')}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 p-4 sm:p-6 py-4 overflow-y-auto flex-1 overscroll-contain">
          {/* 1. Transaction & Property Type */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_transaction_label')}</Label>
              <ToggleGroup
                value={transactionType ? [transactionType] : ['all']}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  setTransactionType(!selected || selected === 'all' ? '' : (selected as TransactionType))
                }}
                className="flex gap-2"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_transaction_all')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="sale"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_transaction_sale')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="rent"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_transaction_rent')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">{t('filter_property_type_label')}</Label>
              <ToggleGroup
                value={propertyType ? [propertyType] : ['all']}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  setPropertyType(!selected || selected === 'all' ? '' : (selected as PropertyType))
                }}
                className="flex flex-wrap gap-2"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('all')}
                </ToggleGroupItem>
                {PROPERTY_TYPES.map((pt) => (
                  <ToggleGroupItem
                    key={pt.value}
                    value={pt.value}
                    size="sm"
                    variant="outline"
                    className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                  >
                    {lang === 'en' ? pt.labelEn : pt.labelPl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <Separator />

          {/* 2. Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_city_label')}</Label>
              <Input
                placeholder={t('filter_city_placeholder')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_district_label')}</Label>
              <Input
                placeholder={t('filter_district_placeholder')}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* 3. Price & Area */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs font-semibold">{t('filter_price_range')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground">{t('from')}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">{t('to')}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t('no_limit')}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = minPrice === preset.min && maxPrice === preset.max
                  return (
                    <Button
                      key={preset.label}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="xs"
                      onClick={() => {
                        if (isSelected) {
                          setMinPrice('')
                          setMaxPrice('')
                        } else {
                          setMinPrice(preset.min)
                          setMaxPrice(preset.max)
                        }
                      }}
                      className="rounded-full text-[11px] h-6 px-2.5 cursor-pointer font-medium"
                    >
                      {preset.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('filter_area_range')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-muted-foreground">{t('filter_min_area')}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">{t('filter_max_area')}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder={t('no_limit')}
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 4. Rooms & Floor */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_rooms_label')}</Label>
              <ToggleGroup
                value={[rooms]}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  if (selected) setRooms(selected)
                }}
                className="flex flex-wrap gap-2"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_rooms_any')}
                </ToggleGroupItem>
                {['1', '2', '3', '4', '5+'].map((r) => (
                  <ToggleGroupItem
                    key={r}
                    value={r}
                    size="sm"
                    variant="outline"
                    className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                  >
                    {r}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t('filter_min_floor')}</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={minFloor}
                  onChange={(e) => setMinFloor(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{t('filter_max_floor')}</span>
                <Input
                  type="number"
                  placeholder={t('no_limit')}
                  value={maxFloor}
                  onChange={(e) => setMaxFloor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 5. Market & Seller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_market_label')}</Label>
              <ToggleGroup
                value={marketType ? [marketType] : ['all']}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  setMarketType(!selected || selected === 'all' ? '' : (selected as MarketType))
                }}
                className="flex flex-wrap gap-1.5"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_market_all')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="primary"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_market_primary')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="secondary"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_market_secondary')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('filter_seller_label')}</Label>
              <ToggleGroup
                value={sellerType ? [sellerType] : ['all']}
                onValueChange={(val) => {
                  const selected = val[val.length - 1]
                  setSellerType(!selected || selected === 'all' ? '' : (selected as SellerType))
                }}
                className="flex flex-wrap gap-1.5"
              >
                <ToggleGroupItem
                  value="all"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('filter_seller_all')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="private"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('seller_private')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="agency"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {t('seller_agency')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Separator />

          {/* 6. Amenities */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('filter_amenities_label')}</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={hasElevator ? 'default' : 'outline'}
                onClick={() => setHasElevator((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_elevator')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={hasBalcony ? 'default' : 'outline'}
                onClick={() => setHasBalcony((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_balcony')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={hasParking ? 'default' : 'outline'}
                onClick={() => setHasParking((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_parking')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={hasAirConditioning ? 'default' : 'outline'}
                onClick={() => setHasAirConditioning((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_ac')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isFurnished ? 'default' : 'outline'}
                onClick={() => setIsFurnished((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_furnished')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={hasBasement ? 'default' : 'outline'}
                onClick={() => setHasBasement((v) => !v)}
                className="rounded-full text-xs h-7 cursor-pointer"
              >
                {t('filter_amenity_basement')}
              </Button>
            </div>
          </div>

          <Separator />

          {/* 7. Portal Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t('filter_portal_label')}</Label>
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
                className="rounded-full px-3 py-1 text-xs font-medium cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
              >
                {t('all')}
              </ToggleGroupItem>
              {PORTALS.map((p) => (
                <ToggleGroupItem
                  key={p}
                  value={p}
                  size="sm"
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium capitalize cursor-pointer aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                >
                  {p}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Separator />

          {/* 8. Sort Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t('filter_sort_label')}</Label>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortBy)}>
              <SelectTrigger className="w-full text-xs h-9 cursor-pointer">
                <SelectValue>
                  {(val: SortBy) =>
                    t(SORT_OPTIONS.find((o) => o.value === (val ?? sortBy))?.labelKey ?? 'sort_newest')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      <SheetFooter className="p-4 sm:p-6 border-t flex flex-row items-center justify-between shrink-0 bg-background/95 backdrop-blur-md sticky bottom-0 z-10">
        <Button variant="ghost" size="sm" onClick={handleClear} className="cursor-pointer">
          {t('filter_reset_btn')}
        </Button>
        <Button size="sm" onClick={handleApply} className="cursor-pointer px-5">
          {t('filter_apply_btn')}
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}

export function FilterModal({ open, onOpenChange, filter, parsedFilters, onApply }: FilterModalProps) {
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
      }
    }
    return filter
  }, [filter, parsedFilters])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <FilterForm
          filter={effectiveFilter}
          onApply={(draft) => {
            onApply(draft)
            onOpenChange(false)
          }}
        />
      ) : null}
    </Sheet>
  )
}
