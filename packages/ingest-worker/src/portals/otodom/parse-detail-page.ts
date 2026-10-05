import type { StandardListing } from '../../types.js';
import { extractNextData } from './parsers.js';
import { enrichListingFromDetail } from './normalizers.js';

export function parseOtodomDetailPage(
  html: string,
  baseListing: StandardListing
): StandardListing {
  const nextData = extractNextData(html);
  const ad = nextData?.props?.pageProps?.ad;

  if (!ad) {
    return baseListing;
  }

  return enrichListingFromDetail(baseListing, ad);
}
