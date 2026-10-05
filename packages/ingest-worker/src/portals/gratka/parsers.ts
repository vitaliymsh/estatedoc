const GRATKA_BASE_URL = 'https://gratka.pl';

export function parseExternalId(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = String(input).match(/(?:ob\/|\/|^)(\d{6,})(?:\/|$|\?)/);
  if (match) {
    return `gratka-${match[1]}`;
  }
  return null;
}

export function parsePrice(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return isNaN(input) ? null : input;

  const text = String(input).replace(/\s+/g, ' ').trim();
  if (!text || /zapytaj|negocj/i.test(text)) return null;

  const cleaned = text.replace(/zł|pln/gi, '').replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

export function parseArea(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return isNaN(input) ? null : input;

  const text = String(input).trim();
  const match = text.match(/([\d\s]+(?:[.,]\d+)?)\s*(?:m²|m2|m\s*kw)/i);
  if (match) {
    const val = parseFloat(match[1].replace(/\s+/g, '').replace(',', '.'));
    return isNaN(val) ? null : val;
  }

  const num = parseFloat(text.replace(/\s+/g, '').replace(',', '.'));
  return isNaN(num) || num <= 0 ? null : num;
}

export function parseRooms(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return isNaN(input) ? null : input;

  const text = String(input).trim().toLowerCase();
  if (text.includes('kawalerka')) return 1;

  const match = text.match(/(\d+)\s*(?:pok|room)/i) || text.match(/^(\d+)$/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? null : val;
  }

  return null;
}

export function parseFloor(
  floorInput: string | number | null | undefined,
  totalFloorsInput?: string | number | null | undefined
): { floor: number | null; totalFloors: number | null } {
  let floor: number | null = null;
  let totalFloors: number | null = null;

  if (floorInput != null) {
    const text = String(floorInput).trim().toLowerCase();
    if (text === 'parter' || text === 'ground') {
      floor = 0;
    } else if (text.includes('suterena')) {
      floor = -1;
    } else {
      const slashMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (slashMatch) {
        floor = parseInt(slashMatch[1], 10);
        totalFloors = parseInt(slashMatch[2], 10);
      } else {
        const numMatch = text.match(/(-?\d+)/);
        if (numMatch) {
          floor = parseInt(numMatch[1], 10);
        }
      }
    }
  }

  if (totalFloors === null && totalFloorsInput != null) {
    const totalMatch = String(totalFloorsInput).match(/(\d+)/);
    if (totalMatch) {
      totalFloors = parseInt(totalMatch[1], 10);
    }
  }

  return { floor, totalFloors };
}

export function buildOfferUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${GRATKA_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function extractImageUrls(images: string | string[] | null | undefined): string[] {
  if (!images) return [];
  const rawList = Array.isArray(images) ? images : [images];
  const seen = new Set<string>();
  const res: string[] = [];

  for (const url of rawList) {
    if (typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
      seen.add(url);
      res.push(url);
    }
  }

  return res;
}
