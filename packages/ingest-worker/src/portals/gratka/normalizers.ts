import type { PropertyType, SellerType, TransactionType } from '../../types.js';

const VOIVODESHIPS = new Set([
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
]);

export function calculatePricePerSqm(price: number | null, area: number | null): number | null {
  if (!price || !area || price <= 0 || area <= 0) return null;
  return Math.round(price / area);
}

export function parseTransactionType(input: string): TransactionType | null {
  const text = (input || '').toLowerCase();
  if (text.includes('wynajem') || text.includes('wynajm') || text.includes('wynajecia') || text.includes('rent')) {
    return 'rent';
  }
  if (text.includes('sprzedaz') || text.includes('sprzedaż') || text.includes('kupno') || text.includes('sale')) {
    return 'sale';
  }
  return null;
}

export function parsePropertyType(input: string): PropertyType {
  const text = (input || '').toLowerCase();
  if (text.includes('dom') || text.includes('szereg') || text.includes('bliźniak')) return 'house';
  if (text.includes('działk') || text.includes('grunt') || text.includes('dzialk')) return 'land';
  if (text.includes('lokal') || text.includes('biur') || text.includes('użytkow') || text.includes('komercyjn')) return 'commercial';
  if (text.includes('garaż') || text.includes('miejsce postojowe') || text.includes('parking')) return 'garage';
  if (text.includes('mieszkan') || text.includes('kawalerk') || text.includes('apartament') || text.includes('pokój')) return 'apartment';
  return 'other';
}

export function parseSellerType(
  seller: { '@type'?: string; name?: string } | string | null | undefined
): SellerType | undefined {
  if (!seller) return undefined;
  if (typeof seller === 'object') {
    const type = seller['@type']?.toLowerCase() || '';
    const name = seller.name?.toLowerCase() || '';
    if (type === 'person') return 'private';
    if (name.includes('deweloper') || name.includes('development')) return 'developer';
    if (
      type === 'organization' ||
      name.includes('nieruchomo') ||
      name.includes('biuro') ||
      name.includes('agencj') ||
      name.includes('agency') ||
      name.includes('estate')
    ) {
      return 'agency';
    }
    if (type === 'organization') return 'company';
  }
  const text = String(seller).toLowerCase();
  if (text.includes('prywatn') || text.includes('właściciel') || text.includes('osoba')) return 'private';
  if (text.includes('deweloper')) return 'developer';
  if (text.includes('biuro') || text.includes('agencj') || text.includes('pośrednik') || text.includes('nieruchomośc') || text.includes('agency') || text.includes('estate')) return 'agency';
  if (text.includes('spółka') || text.includes('firma')) return 'company';
  return undefined;
}

export function extractLocation(
  breadcrumbs: string[] = [],
  address?: { addressLocality?: string; streetAddress?: string; addressRegion?: string },
  fallbackText?: string
): { city: string; district?: string; street?: string } {
  let city = address?.addressLocality?.trim() || '';
  let district: string | undefined;
  let street = address?.streetAddress?.trim() || undefined;

  const validCrumbs = breadcrumbs
    .map((b) => b.trim())
    .filter(
      (b) =>
        b &&
        !VOIVODESHIPS.has(b.toLowerCase()) &&
        !b.toLowerCase().includes('gratka') &&
        !b.toLowerCase().includes('morizon') &&
        !b.toLowerCase().endsWith('.pl') &&
        !b.toLowerCase().includes('nieruchomości') &&
        !b.toLowerCase().includes('mieszkani') &&
        !b.toLowerCase().includes('sprzedaż') &&
        !b.toLowerCase().includes('wynajem') &&
        !b.toLowerCase().includes('domy')
    );

  if (!city && validCrumbs.length > 0) {
    city = validCrumbs[0];
  }

  const cityIndex = validCrumbs.findIndex((c) => c.toLowerCase() === city.toLowerCase());
  if (cityIndex !== -1 && cityIndex + 1 < validCrumbs.length) {
    district = validCrumbs[cityIndex + 1];
  } else if (!district && validCrumbs.length > 1 && validCrumbs[0].toLowerCase() === city.toLowerCase()) {
    district = validCrumbs[1];
  }

  if ((!city || !district || !street) && fallbackText) {
    const parts = fallbackText.split(/[,–-]/).map((p) => p.trim());
    for (const part of parts) {
      if (/^ul\.?\s+/i.test(part) || /^al\.?\s+/i.test(part) || /^pl\.?\s+/i.test(part)) {
        if (!street) street = part;
      } else if (!city && /krak[oó]w/i.test(part)) {
        city = 'Kraków';
      } else if (!city && /warszaw/i.test(part)) {
        city = 'Warszawa';
      } else if (!city && /wroc[lł]aw/i.test(part)) {
        city = 'Wrocław';
      } else if (!city && /gda[nń]sk/i.test(part)) {
        city = 'Gdańsk';
      } else if (!city && /pozna[nń]/i.test(part)) {
        city = 'Poznań';
      } else if (!district && part.length > 2 && !/mieszkanie|dom|sprzedaż|wynajem/i.test(part)) {
        district = part;
      }
    }
  }

  if (!city) city = 'Polska';

  return { city, district, street };
}

export function extractFeatures(
  amenities: string[] = [],
  description?: string
): {
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasBasement?: boolean;
  hasAirConditioning?: boolean;
  isFurnished?: boolean;
} {
  const combined = (amenities.join(' ') + ' ' + (description || '')).toLowerCase();

  return {
    hasElevator: /winda|windą|elevator/i.test(combined) ? true : undefined,
    hasBalcony: /balkon|balkonem|loggia|taras/i.test(combined) ? true : undefined,
    hasParking: /garaż|parking|postojowe|garaz/i.test(combined) ? true : undefined,
    hasBasement: /piwnic|komórka lokatorska/i.test(combined) ? true : undefined,
    hasAirConditioning: /klimatyzacj|klima/i.test(combined) ? true : undefined,
    isFurnished: /meble|umeblowane|wyposażona kuchnia/i.test(combined) ? true : undefined,
  };
}

export function cleanDescriptionHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const withBreaks = noScripts
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n');
  const text = withBreaks.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\r/g, '');
  const cleaned = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  return cleaned || null;
}
