import dotenv from 'dotenv';
import { resolve } from 'path';
import { fetchAllListings } from './portals/sprzedajemy/index.js';
import { mapListingToBatchDto, pushOffersBatch } from './exporter.js';

dotenv.config({ path: resolve(process.cwd(), '../../.env') });

export interface IngestOptions {
  categoryPath?: string;
  maxPages?: number;
  delayMs?: number;
  backendUrl?: string;
  enrichDetails?: boolean;
}

export interface IngestResult {
  totalScraped: number;
  inserted: number;
  updated: number;
}

export async function runIngest(options: IngestOptions = {}): Promise<IngestResult> {
  const categoryPath = options.categoryPath || process.env.SCRAPE_CATEGORY || '/nieruchomosci';
  const maxPages = options.maxPages ?? (Number(process.env.SCRAPE_PAGES) || 1);
  const delayMs = options.delayMs ?? 1000;
  const backendUrl = options.backendUrl || process.env.BACKEND_URL || 'http://localhost:4000';
  const enrichDetails =
    options.enrichDetails ?? (process.env.SCRAPE_ENRICH === 'true' || process.argv.includes('--enrich'));

  console.log(
    `[Ingest] Starting crawl for "${categoryPath}" (maxPages: ${maxPages}, enrichDetails: ${enrichDetails})...`
  );
  const listings = await fetchAllListings({ categoryPath, maxPages, delayMs, enrichDetails });
  console.log(`[Ingest] Scraped ${listings.length} listings. Exporting to backend...`);

  if (listings.length === 0) {
    return { totalScraped: 0, inserted: 0, updated: 0 };
  }

  const dtos = listings.map(mapListingToBatchDto);
  const result = await pushOffersBatch(dtos, backendUrl);
  console.log(`[Ingest] Ingestion complete: inserted ${result.inserted}, updated ${result.updated}`);

  return {
    totalScraped: listings.length,
    inserted: result.inserted,
    updated: result.updated,
  };
}

async function main() {
  try {
    const result = await runIngest();
    console.log('[Ingest] Summary:', result);
  } catch (error) {
    console.error('[Ingest] Error during scraping & ingestion:', error);
    process.exit(1);
  }
}

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  main();
}
