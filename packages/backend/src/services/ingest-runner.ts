import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

export interface IngestRunOptions {
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
    const maxPages = options.maxPages ?? 1;
    const categoryPath = options.categoryPath ?? '/nieruchomosci';
    const rootDir = resolve(process.cwd(), '../..');

    try {
      const { stdout } = await execAsync('npm run ingest --workspace=packages/ingest-worker', {
        cwd: rootDir,
        env: {
          ...process.env,
          SCRAPE_PAGES: String(maxPages),
          SCRAPE_CATEGORY: categoryPath,
        },
        timeout: 30000,
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
