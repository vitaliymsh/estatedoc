import { fileURLToPath } from 'url';
import { runIngest, type IngestOptions, type IngestResult } from './index.js';

export interface SchedulerOptions {
  ingestFn?: (opts: IngestOptions) => Promise<IngestResult>;
  intervalMs?: number;
  limit?: number;
  runImmediately?: boolean;
}

export function createScheduler(options: SchedulerOptions = {}) {
  const ingestFn = options.ingestFn ?? runIngest;
  const intervalHours = Number(process.env.INGEST_INTERVAL_HOURS) || 24;
  const intervalMs = options.intervalMs ?? intervalHours * 60 * 60 * 1000;
  const limit = options.limit ?? (Number(process.env.SCRAPE_LIMIT) || 10);
  const runImmediately = options.runImmediately ?? true;

  let timer: NodeJS.Timeout | null = null;

  const tick = async () => {
    console.log(`[Worker-Scheduler] Starting ingest tick (limit: ${limit})...`);
    try {
      const result = await ingestFn({ limitPerPortal: limit });
      console.log('[Worker-Scheduler] Ingest completed:', result);
    } catch (err) {
      console.error('[Worker-Scheduler] Ingest failed:', err);
    }
  };

  return {
    tick,
    start() {
      if (runImmediately) tick();
      timer = setInterval(tick, intervalMs);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  createScheduler().start();
  console.log('[Worker-Scheduler] Running in background...');
}
