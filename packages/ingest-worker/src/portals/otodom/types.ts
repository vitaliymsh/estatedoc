export * from '../../types.js';

export interface OtodomImage {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  [key: string]: unknown;
}

export interface OtodomMoney {
  value?: number;
  currency?: string;
}

export interface OtodomLocationObject {
  id?: string;
  name?: string;
  locationLevel?: string;
  fullName?: string;
}

export interface OtodomAddress {
  street?: { name?: string; number?: string };
  city?: { name?: string; id?: number };
  province?: { name?: string; id?: number };
}

export interface OtodomCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface OtodomLocation {
  address?: OtodomAddress;
  reverseGeocoding?: {
    locations?: OtodomLocationObject[];
  };
  coordinates?: OtodomCoordinates;
}

export interface OtodomCharacteristic {
  key?: string;
  value?: string;
  localizedValue?: string;
  currency?: string;
}

export interface OtodomSearchItem {
  id: number | string;
  title: string;
  slug: string;
  estate?: string;
  transaction?: string;
  totalPrice?: OtodomMoney;
  pricePerSquareMeter?: OtodomMoney;
  areaInSquareMeters?: number;
  roomsNumber?: string | number;
  floorNumber?: string | number;
  location?: OtodomLocation;
  images?: OtodomImage[];
  shortDescription?: string;
  dateCreated?: string;
  createdAtFirst?: string;
  isPrivateOwner?: boolean;
  agency?: { name?: string; id?: number };
  [key: string]: unknown;
}

export interface OtodomSearchPagination {
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  itemsPerPage?: number;
}

export interface OtodomSearchAds {
  items: OtodomSearchItem[];
  pagination?: OtodomSearchPagination;
}

export interface OtodomDetailAd {
  id: number | string;
  title: string;
  slug?: string;
  description?: string;
  characteristics?: OtodomCharacteristic[];
  images?: OtodomImage[];
  location?: OtodomLocation;
  target?: Record<string, unknown>;
  createdAt?: string;
  advertType?: string;
  advertiserType?: string;
  agency?: { name?: string; id?: number };
  [key: string]: unknown;
}

export interface OtodomNextData {
  props?: {
    pageProps?: {
      data?: {
        searchAds?: OtodomSearchAds;
      };
      ad?: OtodomDetailAd;
      [key: string]: unknown;
    };
  };
}
