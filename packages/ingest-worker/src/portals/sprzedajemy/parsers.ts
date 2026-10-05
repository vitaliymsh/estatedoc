import { parseRooms as sharedParseRooms } from '../../utils/parsers.js';
export { parsePrice, parseArea } from '../../utils/parsers.js';
export const parseRooms = (text: string) => sharedParseRooms(text, false);

export function parseOfferId(input: string): string | null {
  if (!input) return null;
  const match = input.match(/(?:offer-|nr)(\d+)/);
  return match ? match[1] : null;
}

export function parseSellerType(text: string): 'company' | 'private' | 'verified' | undefined {
  if (!text) return undefined;
  if (text.includes('--company') || text.includes('FIRMA') || text.includes('firmy')) return 'company';
  if (text.includes('--private') || text.includes('PRYWATNA') || text.includes('prywatna')) return 'private';
  if (text.includes('--verified') || text.includes('Zweryfikowana')) return 'verified';
  return undefined;
}
