import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { IIngestRunner } from '../services/ingest-runner.js';
import { zodValidatorCompiler } from './offers.js';

const devIngestBodySchema = z.preprocess(
  (v) => v ?? {},
  z.object({
    portal: z.enum(['sprzedajemy', 'morizon', 'otodom', 'gratka', 'all']).default('all'),
    maxPages: z.coerce.number().min(1).max(5).default(1),
    categoryPath: z.string().optional(),
  })
);

export interface DevRoutesOptions {
  runner: IIngestRunner;
  temporaryKey?: string;
}

export const devRoutes: FastifyPluginAsync<DevRoutesOptions> = async (fastify, opts) => {
  fastify.setValidatorCompiler(zodValidatorCompiler);
  const runner = opts.runner;
  const expectedKey = opts.temporaryKey ?? process.env.TEMPORARY_KEY;

  fastify.post('/ingest', { schema: { body: devIngestBodySchema } }, async (request, reply) => {
    if (expectedKey && request.headers['x-temporary-key'] !== expectedKey) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid or missing temporaryKey' });
    }

    const result = await runner.trigger(request.body as z.infer<typeof devIngestBodySchema>);
    return reply.status(result.status === 'ok' ? 200 : 500).send(result);
  });
};

