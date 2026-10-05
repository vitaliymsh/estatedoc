import type { StandardListing } from '../../types.js';
import { extractNextData } from './parsers.js';
import { normalizeSearchItem } from './normalizers.js';

export interface OtodomListPageResult {
  listings: StandardListing[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
}

export function parseOtodomListPage(html: string): OtodomListPageResult {
  const nextData = extractNextData(html);
  const searchAds = nextData?.props?.pageProps?.data?.searchAds;

  if (!searchAds || !Array.isArray(searchAds.items)) {
    return {
      listings: [],
      totalPages: 0,
      totalItems: 0,
      currentPage: 1,
    };
  }

  const items = searchAds.items;
  const pagination = searchAds.pagination || {};

  const listings = items.map(normalizeSearchItem);

  return {
    listings,
    totalPages: pagination.totalPages ?? 1,
    totalItems: pagination.totalItems ?? items.length,
    currentPage: pagination.currentPage ?? 1,
  };
}
