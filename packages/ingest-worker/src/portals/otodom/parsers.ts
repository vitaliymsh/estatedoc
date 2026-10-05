import type { OtodomImage, OtodomNextData } from './types.js';

const ROOMS_ENUM_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  MORE: 11,
};

export function extractNextData(html: string): OtodomNextData | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) return null;

  try {
    return JSON.parse(match[1]) as OtodomNextData;
  } catch {
    return null;
  }
}

export function parseRoomsNumber(rooms: string | number | null | undefined): number | null {
  if (rooms == null) return null;
  if (typeof rooms === 'number') return isNaN(rooms) ? null : rooms;

  const trimmed = rooms.trim().toUpperCase();
  if (!trimmed) return null;

  if (ROOMS_ENUM_MAP[trimmed] !== undefined) {
    return ROOMS_ENUM_MAP[trimmed];
  }

  const numMatch = trimmed.match(/^(\d+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  return null;
}

export function parseFloor(floor: string | number | null | undefined): number | null {
  if (floor == null) return null;
  if (typeof floor === 'number') return isNaN(floor) ? null : floor;

  const trimmed = String(floor).trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed === 'ground' || trimmed === 'parter' || trimmed === 'ground_floor' || trimmed === 'floor_0') {
    return 0;
  }

  const floorMatch = trimmed.match(/floor_(\d+)/);
  if (floorMatch) {
    return parseInt(floorMatch[1], 10);
  }

  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

export function buildOfferUrl(slug: string): string {
  const cleanSlug = slug.replace(/^\[lang\]\/ad\//, '').replace(/^\/ad\//, '');
  return `https://www.otodom.pl/pl/oferta/${cleanSlug}`;
}

export function extractImageUrls(images: OtodomImage[] | undefined): string[] {
  if (!images || !Array.isArray(images)) return [];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const img of images) {
    const url = img.large || img.medium || img.small || img.thumbnail;
    if (url && typeof url === 'string' && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}
