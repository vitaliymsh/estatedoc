export function parsePrice(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) || input < 0 ? null : input;
  const match = String(input).replace(/\s+/g, '').replace(/zł|pln/gi, '').replace(',', '.').match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseArea(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) || input <= 0 ? null : input;
  const match = String(input).replace(/\s+/g, '').replace(',', '.').match(/(\d+(?:\.\d+)?)(?:\s*(?:m²|m2|mkw|$))/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function parseRooms(input: string | number | null | undefined, allowStudioText = false): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) || input <= 0 ? null : input;
  const str = String(input).trim().toLowerCase();
  if (allowStudioText && str.includes('kawalerka')) return 1;
  const match = str.match(/\b(\d+)\b/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

export function calculatePricePerSqm(price: number | null, areaSqm: number | null): number | null {
  return price && areaSqm && areaSqm > 0 ? Math.round(price / areaSqm) : null;
}
