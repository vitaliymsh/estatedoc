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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/lib/i18n'
import type {
  ListOffersFilter,
  SortBy,
  TransactionType,
  PropertyType,
  SellerType,
  MarketType,
} from '../types/offer'

const PORTALS = ['morizon', 'sprzedajemy', 'otodom', 'olx', 'gratka']
const PROPERTY_TYPES: { value: PropertyType; labelPl: string; labelEn: string }[] = [
  { value: 'apartment', labelPl: 'Mieszkanie', labelEn: 'Apartment' },
  { value: 'house', labelPl: 'Dom', labelEn: 'House' },
  { value: 'land', labelPl: 'Działka', labelEn: 'Land' },
  { value: 'commercial', labelPl: 'Lokal', labelEn: 'Commercial' },
  { value: 'garage', labelPl: 'Garaż', labelEn: 'Garage' },
]

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
    let minRoomsVal: number | undefined
    let maxRoomsVal: number | undefined
    if (rooms === '1') { minRoomsVal = 1; maxRoomsVal = 1 }
    else if (rooms === '2') { minRoomsVal = 2; maxRoomsVal = 2 }
    else if (rooms === '3') { minRoomsVal = 3; maxRoomsVal = 3 }
    else if (rooms === '4') { minRoomsVal = 4; maxRoomsVal = 4 }
    else if (rooms === '5+') { minRoomsVal = 5 }

    onApply({
      transactionType: transactionType || undefined,
      propertyType: propertyType || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      portal: portal || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
      minRooms: minRoomsVal,
      maxRooms: maxRoomsVal,
      minFloor: minFloor !== '' ? Number(minFloor) : undefined,
      maxFloor: maxFloor !== '' ? Number(maxFloor) : undefined,
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
    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col justify-between p-6">
      <div>
        <SheetHeader className="p-0 pb-4 border-b">
          <SheetTitle>{t('filter_modal_title')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t('filter_modal_desc')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
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
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('sort_newest')}</SelectItem>
                <SelectItem value="price_asc">{t('sort_price_asc')}</SelectItem>
                <SelectItem value="price_desc">{t('sort_price_desc')}</SelectItem>
                <SelectItem value="price_sqm_asc">{t('sort_price_sqm_asc')}</SelectItem>
                <SelectItem value="price_sqm_desc">{t('sort_price_sqm_desc')}</SelectItem>
                <SelectItem value="area_asc">{t('sort_area_asc')}</SelectItem>
                <SelectItem value="area_desc">{t('sort_area_desc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SheetFooter className="p-0 pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          {t('filter_reset_btn')}
        </Button>
        <Button size="sm" onClick={handleApply}>
          {t('filter_apply_btn')}
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
