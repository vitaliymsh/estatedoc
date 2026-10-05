export function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, '').replace(/zł|pln/gi, '').replace(',', '.');
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseArea(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+(?:\.\d+)?)(?=m²|m2|$)/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseRooms(text: string): number | null {
  if (!text) return null;
  const match = text.match(/\b(\d+)\b/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

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
