import dotenv from 'dotenv';
import { resolve } from 'path';
import { fetchAllListings as fetchSprzedajemy } from './portals/sprzedajemy/index.js';
import { fetchAllListings as fetchMorizon } from './portals/morizon/index.js';
import { fetchAllListings as fetchOtodom } from './portals/otodom/index.js';
import { fetchAllListings as fetchGratka } from './portals/gratka/index.js';
import { mapListingToBatchDto, pushOffersBatch } from './exporter.js';
import { enrichWithJev } from './utils/jev.js';
import type { StandardListing } from './types.js';

dotenv.config();
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export type SupportedPortal = 'sprzedajemy' | 'morizon' | 'otodom' | 'gratka';

export interface IngestOptions {
  portal?: SupportedPortal | 'all';
  categoryPath?: string;
  maxPages?: number;
  limitPerPortal?: number;
  delayMs?: number;
  backendUrl?: string;
  enrichDetails?: boolean;
  forceEnrich?: boolean;
}

export interface IngestResult {
  totalScraped: number;
  inserted: number;
  updated: number;
}

export async function runIngest(options: IngestOptions = {}): Promise<IngestResult> {
  const portal = (options.portal || process.env.SCRAPE_PORTAL || 'all') as SupportedPortal | 'all';
  const maxPages = options.maxPages ?? (Number(process.env.SCRAPE_PAGES) || 1);
  const limitPerPortal =
    options.limitPerPortal ??
    (process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : 3);
  const delayMs = options.delayMs ?? 1000;
  const backendUrl = options.backendUrl || process.env.BACKEND_URL || 'http://localhost:4000';
  const enrichDetails =
    options.enrichDetails ??
    (process.env.SCRAPE_ENRICH !== 'false' && !process.argv.includes('--no-enrich'));
  const forceEnrich =
    options.forceEnrich ?? (process.env.SCRAPE_FORCE === 'true' || process.argv.includes('--force'));

  const knownIds = forceEnrich ? new Set<string>() : undefined;
  const listings: StandardListing[] = [];

const PORTAL_SCRAPERS: Record<
  SupportedPortal,
  { name: string; defaultCategory: string; fetch: (opts: any) => Promise<StandardListing[]> }
> = {
  sprzedajemy: { name: 'Sprzedajemy', defaultCategory: '/nieruchomosci', fetch: fetchSprzedajemy },
  morizon: { name: 'Morizon', defaultCategory: '/mieszkania/warszawa', fetch: fetchMorizon },
  otodom: { name: 'Otodom', defaultCategory: '/pl/wyniki/sprzedaz/mieszkanie/cala-polska', fetch: fetchOtodom },
  gratka: { name: 'Gratka', defaultCategory: '/nieruchomosci/mieszkania/warszawa', fetch: fetchGratka },
};

  const activePortals = (
    portal === 'all' ? (Object.keys(PORTAL_SCRAPERS) as SupportedPortal[]) : [portal]
  ).filter((p) => p in PORTAL_SCRAPERS);

  for (const p of activePortals) {
    const config = PORTAL_SCRAPERS[p];
    const categoryPath =
      (portal === p ? options.categoryPath : undefined) ||
      (portal === p ? process.env.SCRAPE_CATEGORY : undefined) ||
      config.defaultCategory;

    try {
      console.log(
        `[Ingest-${config.name}] Starting crawl for "${categoryPath}" (maxPages: ${maxPages}, limit: ${limitPerPortal}, enrichDetails: ${enrichDetails}, forceEnrich: ${forceEnrich})...`
      );
      let portalListings = await config.fetch({
        categoryPath,
        maxPages,
        limit: limitPerPortal > 0 ? limitPerPortal : undefined,
        delayMs,
        enrichDetails,
        backendUrl,
        knownIds,
      });
      if (limitPerPortal > 0) {
        portalListings = portalListings.slice(0, limitPerPortal);
      }
      console.log(`[Ingest-${config.name}] Scraped & kept ${portalListings.length} listings.`);
      listings.push(...portalListings);
    } catch (err) {
      console.error(`[Ingest-${config.name}] Failed to crawl ${config.name}:`, err);
    }
  }

  const validListings = listings.filter((l) => Array.isArray(l.images) && l.images.length > 0);

  if (validListings.length === 0) {
    console.log(`[Ingest] No valid listings with images found out of ${listings.length} scraped.`);
    return { totalScraped: listings.length, inserted: 0, updated: 0 };
  }

  // Enrich listings with Jev decisions if API key configured and fields missing
  if (process.env.OPENROUTER_API_KEY) {
    for (const listing of validListings) {
      if (listing.description && !listing.metadata?.buildingType) {
        try {
          const jevData = await enrichWithJev({
            title: listing.title,
            description: listing.description,
          });
          if (jevData) {
            listing.metadata = { ...listing.metadata, ...jevData };
          }
        } catch {
          // ponytail: continue on single listing enrichment failure
        }
      }
    }
  }

  const dtos = validListings.map(mapListingToBatchDto);
  const result = await pushOffersBatch(dtos, backendUrl);
  console.log(`[Ingest] Ingestion complete: inserted ${result.inserted}, updated ${result.updated} (out of ${validListings.length} with images)`);

  return {
    totalScraped: listings.length,
    inserted: result.inserted,
    updated: result.updated,
  };
}

async function main() {
  try {
    const portalArg = process.argv.find((a) => a.startsWith('--portal='))?.split('=')[1] as
      | SupportedPortal
      | 'all'
      | undefined;
    const categoryArg = process.argv.find((a) => a.startsWith('--category='))?.split('=')[1];
    const pagesArg = process.argv.find((a) => a.startsWith('--pages='))?.split('=')[1];
    const limitArg = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
    const enrichArg = process.argv.includes('--no-enrich')
      ? false
      : process.argv.includes('--enrich')
        ? true
        : undefined;
    const forceArg = process.argv.includes('--force');

    const result = await runIngest({
      portal: portalArg,
      categoryPath: categoryArg,
      maxPages: pagesArg ? parseInt(pagesArg, 10) : undefined,
      limitPerPortal: limitArg ? parseInt(limitArg, 10) : 3,
      enrichDetails: enrichArg,
      forceEnrich: forceArg || undefined,
    });
    console.log('[Ingest] Summary:', result);
  } catch (error) {
    console.error('[Ingest] Error during scraping & ingestion:', error);
    process.exit(1);
  }
}

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  main();
}
