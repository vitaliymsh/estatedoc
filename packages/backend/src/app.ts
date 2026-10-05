import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { db, closeDb } from './db/index.js';
import { DrizzleOfferRepository } from './repositories/drizzle-offer.repository.js';
import { offersRoutes } from './routes/offers.js';
import { devRoutes } from './routes/dev.js';
import { ProcessIngestRunner, type IIngestRunner } from './services/ingest-runner.js';
import type { IOfferRepository } from './repositories/offer.repository.js';
import type { IQueryParser } from './services/query-parser.js';

export interface BuildAppOptions {
  repository?: IOfferRepository;
  runner?: IIngestRunner;
  queryParser?: IQueryParser;
  logger?: boolean;
  rateLimitMax?: number;
  rateLimitTimeWindow?: string | number;
  bodyLimit?: number;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: options.bodyLimit ?? 10 * 1024 * 1024,
  });
  await app.register(cors);
  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 100,
    timeWindow: options.rateLimitTimeWindow ?? '1 minute',
  });


  app.setErrorHandler((error, _request, reply) => {
    const err = error as { statusCode?: number; message?: string };
    const statusCode = err.statusCode ?? 500;
    app.log.error(error);
    reply.status(statusCode).send({
      error: err.message || 'Internal Server Error',
      statusCode,
    });
  });

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const repository = options.repository ?? new DrizzleOfferRepository(db);
  await app.register(offersRoutes, { prefix: '/api/offers', repository, queryParser: options.queryParser });

  const runner = options.runner ?? new ProcessIngestRunner();
  await app.register(devRoutes, { prefix: '/api/dev', runner });

  app.addHook('onClose', async () => {
    if (!options.repository) {
      await closeDb();
    }
  });

  return app;
}
