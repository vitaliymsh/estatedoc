import type { TransactionType, PropertyType } from './types.js';

export { calculatePricePerSqm } from '../../utils/parsers.js';
export { sanitizeTitle, sanitizeStreet, sanitizeDescription, cleanCityAndDistrict } from '../../utils/sanitizers.js';

export function parseTransactionType(input: string): TransactionType | null {
  if (!input) return null;
  const clean = input
    .replace(/https?:\/\/[^\s/]+/gi, '')
    .replace(/\bsprzedajemy(?:\.pl)?\b/gi, '')
    .trim();
  const lower = clean.toLowerCase();
  if (/(?:wynaje|wynajm|najem|do\s+wynaj[eę]cia|\bwynajem\b|\brent\b)/.test(lower)) return 'rent';
  if (/(?:sprzeda[żz]|sprzedam|kupno|\bsale\b)/.test(lower)) return 'sale';
  return null;
}

export function parsePropertyType(input: string): PropertyType {
  if (!input) return 'other';
  const lower = input.toLowerCase();
  if (/(mieszka|apartament|kawalerka)/.test(lower)) return 'apartment';
  if (/(\bdom\b|\bdomy\b|\/domy|\/dom-|\bblizniak\b|\bszereg)/.test(lower)) return 'house';
  if (/(dzialk|działk|grunt|\blas\b)/.test(lower)) return 'land';
  if (/(lokal|biur|magazyn|hale)/.test(lower)) return 'commercial';
  if (/(garaz|garaż|postojowe)/.test(lower)) return 'garage';
  return 'other';
}

export function parseFloor(input: string): { floor: number | null; totalFloors: number | null } {
  if (!input) return { floor: null, totalFloors: null };
  const lower = input.toLowerCase().trim();

  if (lower.includes('/')) {
    const [part1, part2] = lower.split('/').map((s) => s.trim());
    const floor = part1 === 'parter' ? 0 : parseInt(part1, 10);
    const total = parseInt(part2, 10);
    return {
      floor: isNaN(floor) ? null : floor,
      totalFloors: isNaN(total) ? null : total,
    };
  }

  if (lower === 'parter') return { floor: 0, totalFloors: null };
  const num = parseInt(lower, 10);
  return {
    floor: isNaN(num) ? null : num,
    totalFloors: null,
  };
}
