export type SupportedPortalImage = 'morizon' | 'sprzedajemy';

const IGNORED_KEYWORDS = ['logo', 'avatar', 'facebook', 'sp.gif', 'icon', 'badge', 'agent', 'pixel'];

export function upgradeImageUrl(url: string, portal: SupportedPortalImage): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  if (portal === 'morizon') {
    cleanUrl = cleanUrl.replace(/\/thumb\//gi, '/big/').replace(/\/mini\//gi, '/big/');
  } else if (portal === 'sprzedajemy') {
    // Standardize thumbs.img-sprzedajemy.pl resolutions to 1024x768_0
    cleanUrl = cleanUrl.replace(
      /\/thumb\/[0-9]+x[0-9]+[a-z0-9_]*\//gi,
      '/thumb/1024x768_0/'
    );
    // Also handle non-/thumb/ path variants if any e.g. /350x250c/ -> /thumb/1024x768_0/
    cleanUrl = cleanUrl.replace(
      /(thumbs\.img-sprzedajemy\.pl\/)[0-9]+x[0-9]+[a-z0-9_]*\//gi,
      '$1thumb/1024x768_0/'
    );
  }

  return cleanUrl;
}

export function cleanAndDeduplicateImages(
  urls: (string | undefined | null)[],
  portal: SupportedPortalImage
): string[] {
  const result: string[] = [];
  const seenKeys = new Set<string>();

  for (const rawUrl of urls) {
    if (!rawUrl || typeof rawUrl !== 'string') continue;
    const lower = rawUrl.toLowerCase();
    if (IGNORED_KEYWORDS.some((kw) => lower.includes(kw))) continue;

    const highRes = upgradeImageUrl(rawUrl, portal);
    if (!highRes.startsWith('http')) continue;

    // Deduplicate by file hash/name ignoring resolution prefix
    const key = highRes
      .split('?')[0]
      .replace(/\/thumb\/[0-9]+x[0-9]+[a-z0-9_]*\//i, '/')
      .replace(/(thumbs\.img-sprzedajemy\.pl\/)[0-9]+x[0-9]+[a-z0-9_]*\//i, '$1');

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(highRes);
    }
  }

  return result;
}
