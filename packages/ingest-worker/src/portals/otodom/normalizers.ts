import type {
  PropertyType,
  TransactionType,
  SellerType,
  StandardListing,
  StandardListingMetadata,
} from '../../types.js';
import type { OtodomSearchItem, OtodomDetailAd } from './types.js';
import {
  parseRoomsNumber,
  parseFloor,
  buildOfferUrl,
  extractImageUrls,
} from './parsers.js';
import {
  sanitizeTitle,
  sanitizeStreet,
  sanitizeDescription,
  cleanCityAndDistrict,
} from '../../utils/sanitizers.js';

export function normalizePropertyType(estate?: string): PropertyType {
  if (!estate) return 'apartment';
  const norm = estate.trim().toUpperCase();

  switch (norm) {
    case 'FLAT':
    case 'MIESZKANIE':
      return 'apartment';
    case 'HOUSE':
    case 'DOM':
      return 'house';
    case 'TERRAIN':
    case 'DZIALKA':
      return 'land';
    case 'COMMERCIAL':
    case 'LOKAL':
    case 'BIURO':
      return 'commercial';
    case 'GARAGE':
    case 'GARAZ':
      return 'garage';
    default:
      return 'apartment';
  }
}

export function normalizeTransactionType(transaction?: string): TransactionType {
  if (!transaction) return 'sale';
  const norm = transaction.trim().toUpperCase();
  if (norm === 'RENT' || norm === 'WYNAJEM') return 'rent';
  return 'sale';
}

export function normalizeSellerType(isPrivate?: boolean, agency?: unknown): SellerType {
  if (isPrivate) return 'private';
  if (agency && typeof agency === 'object') return 'agency';
  return 'company';
}

export function normalizeSearchItem(item: OtodomSearchItem): StandardListing {
  const images = extractImageUrls(item.images);
  const propertyType = normalizePropertyType(item.estate);
  const transactionType = normalizeTransactionType(item.transaction);
  const sellerType = normalizeSellerType(item.isPrivateOwner, item.agency);

  // Address extraction
  const addr = item.location?.address;
  const revGeo = item.location?.reverseGeocoding?.locations || [];

  const districtObj = revGeo.find((l) => l.locationLevel === 'district');
  const cityObj = revGeo.find((l) => l.locationLevel === 'city_or_village');

  const rawCity = addr?.city?.name || cityObj?.name || 'Polska';
  const rawDistrict = districtObj?.name;
  const { city, district } = cleanCityAndDistrict(rawCity, rawDistrict);
  const street = addr?.street?.name;
  const province = addr?.province?.name || revGeo.find((l) => l.locationLevel === 'voivodeship')?.name;

  const metadata: StandardListingMetadata = {};
  if (item.agency?.name) {
    metadata.agencyName = item.agency.name;
  }
  if (province) {
    metadata.province = province;
  }
  if (item.totalPrice?.currency) {
    metadata.currency = item.totalPrice.currency;
  }
  if (item.pricePerSquareMeter?.value) {
    metadata.pricePerSqm = item.pricePerSquareMeter.value;
  }

  return {
    portal: 'otodom',
    externalId: String(item.id),
    url: buildOfferUrl(item.slug),
    title: sanitizeTitle(item.title),
    price: item.totalPrice?.value ?? null,
    pricePerSqm: item.pricePerSquareMeter?.value ?? null,
    areaSqm: item.areaInSquareMeters ?? null,
    roomsCount: parseRoomsNumber(item.roomsNumber),
    floor: parseFloor(item.floorNumber),
    totalFloors: null,
    transactionType,
    propertyType,
    city,
    district,
    street: sanitizeStreet(street) ?? undefined,
    sellerType,
    description: sanitizeDescription(item.shortDescription),
    images,
    postedAt: item.createdAtFirst || item.dateCreated,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

export function enrichListingFromDetail(
  listing: StandardListing,
  ad: OtodomDetailAd
): StandardListing {
  const meta: StandardListingMetadata = {
    ...(listing.metadata || {}),
  };

  let floor = listing.floor;

  // Characteristics key-value
  const chars = ad.characteristics || [];
  for (const c of chars) {
    if (!c.key || !c.value) continue;
    if (c.key === 'rent') {
      const parsed = parseFloat(c.value);
      if (!isNaN(parsed)) meta.rentExtra = parsed;
    } else if (c.key === 'building_type') {
      meta.buildingType = c.value;
    } else if (c.key === 'building_material') {
      meta.buildingMaterial = c.value;
    } else if (c.key === 'heating') {
      meta.heating = c.value;
    } else if (c.key === 'construction_status') {
      meta.condition = c.value;
    } else if (c.key === 'building_ownership') {
      meta.ownership = c.value;
    } else if (c.key === 'floor_no' && floor === null) {
      const parsed = parseFloor(c.value);
      if (parsed !== null) floor = parsed;
    }
  }

  // Target key-value
  const target = ad.target || {};
  if (target.Build_year) {
    const year = parseInt(String(target.Build_year), 10);
    if (!isNaN(year)) meta.yearBuilt = year;
  }
  if (target.Construction_status) {
    meta.condition = String(target.Construction_status);
  }
  if (target.Building_ownership) {
    meta.ownership = String(target.Building_ownership);
  }
  let totalFloors = listing.totalFloors;
  if (target.Building_floors_num) {
    const tf = parseInt(String(target.Building_floors_num), 10);
    if (!isNaN(tf)) totalFloors = tf;
  }
  if (floor === null && target.Floor_no) {
    const floorVal = Array.isArray(target.Floor_no) ? target.Floor_no[0] : target.Floor_no;
    const parsed = parseFloor(floorVal as string | number);
    if (parsed !== null) floor = parsed;
  }

  const extras = Array.isArray(target.Extras_types) ? target.Extras_types : [];
  if (extras.includes('lift') || extras.includes('winda')) meta.hasElevator = true;
  if (extras.includes('balcony') || extras.includes('balkon')) meta.hasBalcony = true;
  if (extras.includes('garden') || extras.includes('ogrod') || extras.includes('ogródek')) meta.hasGarden = true;
  if (extras.includes('terrace') || extras.includes('taras')) meta.hasTerrace = true;
  if (extras.includes('garage') || extras.includes('parking') || extras.includes('garaz')) {
    meta.hasParking = true;
  }

  // Coordinates
  const coords = ad.location?.coordinates;
  if (coords?.latitude && coords?.longitude) {
    meta.latitude = coords.latitude;
    meta.longitude = coords.longitude;
  }

  // Detailed images
  const detailImages = extractImageUrls(ad.images);
  const finalImages = detailImages.length > 0 ? detailImages : listing.images;

  return {
    ...listing,
    description: sanitizeDescription(ad.description) || listing.description,
    floor,
    totalFloors,
    images: finalImages,
    metadata: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
