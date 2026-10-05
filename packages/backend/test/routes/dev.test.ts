import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import { devRoutes } from '../../src/routes/dev.js';
import type { IIngestRunner } from '../../src/services/ingest-runner.js';

describe('Dev Routes', () => {
  let app: ReturnType<typeof Fastify>;
  let mockRunner: IIngestRunner;

  beforeEach(async () => {
    mockRunner = {
      trigger: vi.fn().mockResolvedValue({ status: 'ok', message: 'Ingestion completed' }),
    };
    app = Fastify();
    await app.register(devRoutes, { prefix: '/api/dev', runner: mockRunner });
    await app.ready();
  });

  it('POST /api/dev/ingest triggers runner and returns result', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      payload: { portal: 'morizon', maxPages: 2, categoryPath: '/mieszkania/warszawa' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', message: 'Ingestion completed' });
    expect(mockRunner.trigger).toHaveBeenCalledWith({
      portal: 'morizon',
      maxPages: 2,
      categoryPath: '/mieszkania/warszawa',
    });
  });

  it('POST /api/dev/ingest uses default parameters when payload is empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      payload: {},
    });

    expect(res.statusCode).toBe(200);
    expect(mockRunner.trigger).toHaveBeenCalledWith({
      portal: 'all',
      maxPages: 1,
    });
  });

  it('POST /api/dev/ingest accepts otodom and gratka portal options', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      payload: { portal: 'gratka', maxPages: 3 },
    });

    expect(res.statusCode).toBe(200);
    expect(mockRunner.trigger).toHaveBeenCalledWith({
      portal: 'gratka',
      maxPages: 3,
    });
  });

  it('POST /api/dev/ingest validates temporaryKey when configured', async () => {
    const secureApp = Fastify();
    await secureApp.register(devRoutes, {
      prefix: '/api/dev',
      runner: mockRunner,
      temporaryKey: 'secretKey123',
    });
    await secureApp.ready();

    const missingRes = await secureApp.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      payload: {},
    });
    expect(missingRes.statusCode).toBe(401);

    const wrongRes = await secureApp.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      headers: { 'x-temporary-key': 'wrong' },
      payload: {},
    });
    expect(wrongRes.statusCode).toBe(401);

    const okRes = await secureApp.inject({
      method: 'POST',
      url: '/api/dev/ingest',
      headers: { 'x-temporary-key': 'secretKey123' },
      payload: {},
    });
    expect(okRes.statusCode).toBe(200);
  });
});
