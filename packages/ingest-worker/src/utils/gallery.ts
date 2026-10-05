export type SupportedPortalImage = 'morizon' | 'sprzedajemy';

const IGNORED_KEYWORDS = ['logo', 'avatar', 'facebook', 'sp.gif', 'icon', 'badge', 'agent', 'pixel'];

export function cleanAndDeduplicateImages(
  urls: (string | undefined | null)[],
  _portal?: SupportedPortalImage
): string[] {
  const result: string[] = [];
  const seenKeys = new Set<string>();

  const flatUrls: string[] = [];
  for (const item of urls) {
    if (!item || typeof item !== 'string') continue;
    if (item.includes(',')) {
      flatUrls.push(...item.split(',').map((s) => s.trim()));
    } else {
      flatUrls.push(item.trim());
    }
  }

  for (const rawUrl of flatUrls) {
    if (!rawUrl) continue;
    const cleanUrl = rawUrl.split(/\s+/)[0].trim();
    if (!cleanUrl.startsWith('http')) continue;

    const lower = cleanUrl.toLowerCase();
    if (IGNORED_KEYWORDS.some((kw) => lower.includes(kw)) || lower.endsWith('.svg')) continue;

    const key = cleanUrl.split('?')[0];
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(cleanUrl);
    }
  }

  return result;
}

