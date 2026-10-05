import { describe, it, expect, vi } from 'vitest';
import { createScheduler } from '../scheduler.js';

describe('createScheduler', () => {
  it('triggers ingest tick with configured limit', async () => {
    const mockIngest = vi.fn().mockResolvedValue({ totalScraped: 10, inserted: 10, updated: 0 });
    const scheduler = createScheduler({
      ingestFn: mockIngest,
      limit: 10,
    });

    await scheduler.tick();

    expect(mockIngest).toHaveBeenCalledTimes(1);
    expect(mockIngest).toHaveBeenCalledWith({ limitPerPortal: 10 });
  });

  it('runs on configured interval', async () => {
    vi.useFakeTimers();
    const mockIngest = vi.fn().mockResolvedValue({ totalScraped: 5, inserted: 5, updated: 0 });
    const scheduler = createScheduler({
      ingestFn: mockIngest,
      intervalMs: 60000,
      limit: 5,
      runImmediately: false,
    });

    scheduler.start();
    expect(mockIngest).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(60000);
    expect(mockIngest).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60000);
    expect(mockIngest).toHaveBeenCalledTimes(2);

    scheduler.stop();
    vi.useRealTimers();
  });
});
