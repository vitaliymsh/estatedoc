import type { SellerType } from './types.js';

export function parsePrice(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? null : input;
  }
  const str = String(input).trim();
  if (!str) return null;
  const cleaned = str.replace(/\s+/g, '').replace(/zł|pln/gi, '').replace(',', '.');
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseArea(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) || input <= 0 ? null : input;
  }
  const str = String(input).trim();
  if (!str) return null;
  const cleaned = str.replace(/\s+/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+(?:\.\d+)?)(?:\s*(?:m²|m2|mkw|$))/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseRooms(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) || input <= 0 ? null : input;
  }
  const str = String(input).trim().toLowerCase();
  if (!str) return null;
  if (str.includes('kawalerka')) return 1;
  const match = str.match(/\b(\d+)\b/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

export function parseFloor(
  input: string | number | null | undefined
): { floor: number | null; totalFloors: number | null } {
  if (input === null || input === undefined) return { floor: null, totalFloors: null };
  if (typeof input === 'number') {
    return { floor: isNaN(input) ? null : input, totalFloors: null };
  }
  const str = String(input).trim().toLowerCase();
  if (!str) return { floor: null, totalFloors: null };

  if (str.includes('/')) {
    const [part1, part2] = str.split('/').map((s) => s.trim());
    const floor = part1 === 'parter' ? 0 : parseInt(part1, 10);
    const total = parseInt(part2, 10);
    return {
      floor: isNaN(floor) ? null : floor,
      totalFloors: isNaN(total) ? null : total,
    };
  }

  if (str === 'parter') return { floor: 0, totalFloors: null };
  const num = parseInt(str, 10);
  return {
    floor: isNaN(num) ? null : num,
    totalFloors: null,
  };
}

export function parseExternalId(input: string | null | undefined): string | null {
  if (!input) return null;
  const str = input.trim().replace(/\/$/, '');
  const mznMatch = str.match(/(mzn\d+|morizon\d+)/i);
  if (mznMatch) return mznMatch[1];
  const endMatch = str.match(/-([a-zA-Z0-9]+)$/);
  if (endMatch) return endMatch[1];
  const lastSegment = str.split('/').pop();
  return lastSegment || null;
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
    if (type === 'organization' || name.includes('nieruchomo') || name.includes('biuro') || name.includes('agency')) {
      return 'agency';
    }
    if (type === 'organization') return 'company';
  }
  const text = String(seller).toLowerCase();
  if (text.includes('prywatna') || text.includes('osoba')) return 'private';
  if (text.includes('deweloper')) return 'developer';
  if (text.includes('biuro') || text.includes('nieruchomo') || text.includes('agency')) return 'agency';
  if (text.includes('firma')) return 'company';
  return undefined;
}
