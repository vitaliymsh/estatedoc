import type { TransactionType, PropertyType, MorizonJsonLdAddress } from './types.js';

export { calculatePricePerSqm } from '../../utils/parsers.js';

export function parseTransactionType(input: string | null | undefined): TransactionType | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  if (lower.includes('wynaj') || lower.includes('najem') || lower.includes('rent') || lower.includes('do-wynajecia')) {
    return 'rent';
  }
  if (lower.includes('sprzeda') || lower.includes('sale') || lower.includes('mieszkania') || lower.includes('domy')) {
    return 'sale';
  }
  return null;
}

export function parsePropertyType(input: string | null | undefined): PropertyType {
  if (!input) return 'other';
  const lower = input.toLowerCase();
  if (/(mieszka|apartament|kawalerka|flat)/.test(lower)) return 'apartment';
  if (/(\bdom\b|\bdomy\b|\/domy|\/dom-|\bblizniak\b|\bszereg|house)/.test(lower)) return 'house';
  if (/(dzialk|działk|grunt|\blas\b|plot|land)/.test(lower)) return 'land';
  if (/(lokal|biur|magazyn|hale|commercial)/.test(lower)) return 'commercial';
  if (/(garaz|garaż|postojowe|garage)/.test(lower)) return 'garage';
  return 'other';
}

export function extractCityAndDistrict(
  address?: MorizonJsonLdAddress,
  breadcrumbs?: string[],
  title?: string
): { city: string; district?: string } {
  let city = 'Polska';
  let district: string | undefined;

  if (breadcrumbs && breadcrumbs.length >= 3) {
    // Breadcrumbs on morizon: [..., 'mazowieckie', 'Warszawa', 'Praga-Północ', 'Nowa Praga']
    const cleanCrumbs = breadcrumbs.filter(
      (c) =>
        c &&
        !c.toLowerCase().includes('morizon') &&
        !c.toLowerCase().includes('sprzedaż') &&
        !c.toLowerCase().includes('wynajem') &&
        !c.toLowerCase().includes('mieszkani') &&
        !c.toLowerCase().includes('domy') &&
        !c.toLowerCase().includes('działk')
    );

    if (cleanCrumbs.length > 1) {
      // e.g. ['mazowieckie', 'Warszawa', 'Praga-Północ'] -> city: Warszawa, district: Praga-Północ
      city = cleanCrumbs[1] || cleanCrumbs[0];
      district = cleanCrumbs[2] || undefined;
    } else if (cleanCrumbs.length === 1) {
      city = cleanCrumbs[0];
    }
  }

  if (city === 'Polska' && address?.addressLocality) {
    city = address.addressLocality;
  }

  if (!district && address?.streetAddress && address.streetAddress !== city) {
    // streetAddress or locality might be district
    if (address.addressLocality && address.addressLocality !== city) {
      district = address.addressLocality;
    }
  }

  if (city === 'Polska' && title) {
    const parts = title.split(',');
    if (parts.length > 1) {
      city = parts[parts.length - 1].trim();
    }
  }

  return { city, district };
}

export function cleanDescriptionHtml(htmlOrText: string | null | undefined): string | null {
  if (!htmlOrText) return null;
  const stripped = htmlOrText
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.length > 0 ? stripped : null;
}
