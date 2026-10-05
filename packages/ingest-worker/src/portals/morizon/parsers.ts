import type { SellerType } from './types.js';
import { parseRooms as sharedParseRooms } from '../../utils/parsers.js';

export { parsePrice, parseArea } from '../../utils/parsers.js';
export const parseRooms = (input: string | number | null | undefined) => sharedParseRooms(input, true);

export function parseFloor(
  input: string | number | null | undefined
): { floor: number | null; totalFloors: number | null } {
  if (input === null || input === undefined) return { floor: null, totalFloors: null };
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

  const floor = str === 'parter' ? 0 : parseInt(str, 10);
  return {
    floor: isNaN(floor) ? null : floor,
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
