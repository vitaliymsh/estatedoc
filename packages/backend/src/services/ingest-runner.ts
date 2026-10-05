import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const execAsync = promisify(exec);

export interface IngestRunOptions {
  portal?: 'sprzedajemy' | 'morizon' | 'otodom' | 'gratka' | 'all';
  maxPages?: number;
  categoryPath?: string;
}

export interface IngestRunResult {
  status: 'ok' | 'error';
  message: string;
}

export interface IIngestRunner {
  trigger(options: IngestRunOptions): Promise<IngestRunResult>;
}

export class ProcessIngestRunner implements IIngestRunner {
  async trigger(options: IngestRunOptions): Promise<IngestRunResult> {
    const portal = options.portal ?? 'all';
    const maxPages = options.maxPages ?? 1;
    const rootDir = resolve(process.cwd(), '../..');

    try {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        SCRAPE_PORTAL: portal,
        SCRAPE_PAGES: String(maxPages),
        ...(options.categoryPath ? { SCRAPE_CATEGORY: options.categoryPath } : {}),
      };

      const { stdout } = await execAsync('npm run ingest --workspace=packages/ingest-worker', {
        cwd: rootDir,
        env,
        timeout: 60000,
      });

      return {
        status: 'ok',
        message: stdout.trim() || 'Ingestion finished',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        message: msg,
      };
    }
  }
}
