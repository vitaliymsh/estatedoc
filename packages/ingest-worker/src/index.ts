import { fetchAllListings } from './portals/sprzedajemy/index.js';

async function main() {
  const categoryPath = process.env.SCRAPE_CATEGORY || '/nieruchomosci';
  const maxPages = Number(process.env.SCRAPE_PAGES) || 1;

  console.log(`[Ingest] Scraping sprzedajemy.pl category "${categoryPath}" (maxPages: ${maxPages})...`);

  try {
    const listings = await fetchAllListings({ categoryPath, maxPages, delayMs: 1000 });
    console.log(`[Ingest] Scraped ${listings.length} listings:`);
    console.log(JSON.stringify(listings, null, 2));
  } catch (error) {
    console.error('[Ingest] Error during scraping:', error);
    process.exit(1);
  }
}

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  main();
}
