import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { db, closeDb } from './db/index.js';
import { DrizzleOfferRepository } from './repositories/drizzle-offer.repository.js';
import { offersRoutes } from './routes/offers.js';
import { devRoutes } from './routes/dev.js';
import { ProcessIngestRunner, type IIngestRunner } from './services/ingest-runner.js';
import type { IOfferRepository } from './repositories/offer.repository.js';

export interface BuildAppOptions {
  repository?: IOfferRepository;
  runner?: IIngestRunner;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  await app.register(cors);

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
  await app.register(offersRoutes, { prefix: '/api/offers', repository });

  const runner = options.runner ?? new ProcessIngestRunner();
  await app.register(devRoutes, { prefix: '/api/dev', runner });

  app.addHook('onClose', async () => {
    if (!options.repository) {
      await closeDb();
    }
  });

  return app;
}
