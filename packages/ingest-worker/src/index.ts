import dotenv from 'dotenv';
import { resolve } from 'path';
import { fetchAllListings as fetchSprzedajemy } from './portals/sprzedajemy/index.js';
import { fetchAllListings as fetchMorizon } from './portals/morizon/index.js';
import { mapListingToBatchDto, pushOffersBatch } from './exporter.js';
import type { StandardListing } from './types.js';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export type SupportedPortal = 'sprzedajemy' | 'morizon';

export interface IngestOptions {
  portal?: SupportedPortal | 'all';
  categoryPath?: string;
  maxPages?: number;
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
  const delayMs = options.delayMs ?? 1000;
  const backendUrl = options.backendUrl || process.env.BACKEND_URL || 'http://localhost:4000';
  const enrichDetails =
    options.enrichDetails ?? (process.env.SCRAPE_ENRICH === 'true' || process.argv.includes('--enrich'));
  const forceEnrich =
    options.forceEnrich ?? (process.env.SCRAPE_FORCE === 'true' || process.argv.includes('--force'));

  const knownIds = forceEnrich ? new Set<string>() : undefined;
  const listings: StandardListing[] = [];

  if (portal === 'sprzedajemy' || portal === 'all') {
    const categoryPath =
      (portal === 'sprzedajemy' ? options.categoryPath : undefined) ||
      process.env.SCRAPE_CATEGORY ||
      '/nieruchomosci';
    try {
      console.log(
        `[Ingest-Sprzedajemy] Starting crawl for "${categoryPath}" (maxPages: ${maxPages}, enrichDetails: ${enrichDetails}, forceEnrich: ${forceEnrich})...`
      );
      const portalListings = await fetchSprzedajemy({
        categoryPath,
        maxPages,
        delayMs,
        enrichDetails,
        backendUrl,
        knownIds,
      });
      console.log(`[Ingest-Sprzedajemy] Scraped ${portalListings.length} listings.`);
      listings.push(...portalListings);
    } catch (err) {
      console.error('[Ingest-Sprzedajemy] Failed to crawl Sprzedajemy:', err);
    }
  }

  if (portal === 'morizon' || portal === 'all') {
    const categoryPath =
      (portal === 'morizon' ? options.categoryPath : undefined) ||
      (portal === 'morizon' ? process.env.SCRAPE_CATEGORY : undefined) ||
      '/mieszkania/warszawa';
    try {
      console.log(
        `[Ingest-Morizon] Starting crawl for "${categoryPath}" (maxPages: ${maxPages}, enrichDetails: ${enrichDetails}, forceEnrich: ${forceEnrich})...`
      );
      const portalListings = await fetchMorizon({
        categoryPath,
        maxPages,
        delayMs,
        enrichDetails,
        backendUrl,
        knownIds,
      });
      console.log(`[Ingest-Morizon] Scraped ${portalListings.length} listings.`);
      listings.push(...portalListings);
    } catch (err) {
      console.error('[Ingest-Morizon] Failed to crawl Morizon:', err);
    }
  }

  const validListings = listings.filter((l) => Array.isArray(l.images) && l.images.length > 0);

  if (validListings.length === 0) {
    console.log(`[Ingest] No valid listings with images found out of ${listings.length} scraped.`);
    return { totalScraped: listings.length, inserted: 0, updated: 0 };
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
    const enrichArg = process.argv.includes('--enrich');
    const forceArg = process.argv.includes('--force');

    const result = await runIngest({
      portal: portalArg,
      categoryPath: categoryArg,
      maxPages: pagesArg ? parseInt(pagesArg, 10) : undefined,
      enrichDetails: enrichArg || undefined,
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
