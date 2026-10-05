import { createHash } from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import type { Offer, NewOffer } from '../db/schema.js';
import type { IOfferRepository } from '../repositories/offer.repository.js';
import {
  listOffersQuerySchema,
  getOfferParamsSchema,
  batchIngestOffersSchema,
  checkExistingOffersSchema,
  aiSearchSchema,
  type ListOffersQuery,
  type GetOfferParams,
  type CheckExistingOffersInput,
  type BatchIngestOffersInput,
  type AiSearchInput,
} from '../schemas/offer.js';
import type { IQueryParser } from '../services/query-parser.js';
import { LLMQueryParser } from '../services/query-parser.js';
import { GeminiLLMProvider } from '../services/llm/gemini-llm-provider.js';

export const zodValidatorCompiler = ({ schema }: any) => (data: unknown) => {
  if (!schema?.safeParse) return { value: data };
  const res = schema.safeParse(data);
  return res.success ? { value: res.data } : { error: res.error };
};

function replyWithEtag(request: FastifyRequest, reply: FastifyReply, data: unknown) {
  const etag = `"${createHash('sha1').update(JSON.stringify(data)).digest('hex')}"`;
  reply.header('Cache-Control', 'no-cache').header('ETag', etag);
  return request.headers['if-none-match'] === etag ? reply.status(304).send() : data;
}

export interface OffersRoutesOptions {
  repository: IOfferRepository;
  queryParser?: IQueryParser;
  temporaryKey?: string;
}

export function toOfferDto(row: Offer) {
  const price = row.price != null ? Number(row.price) : null;
  const areaSqm = row.areaSqm != null ? Number(row.areaSqm) : null;
  const pricePerSqm =
    row.pricePerSqm != null
      ? Number(row.pricePerSqm)
      : price != null && areaSqm ? Math.round(price / areaSqm) : null;

  return { ...row, price, areaSqm, pricePerSqm };
}

export const offersRoutes: FastifyPluginAsync<OffersRoutesOptions> = async (fastify, opts) => {
  fastify.setValidatorCompiler(zodValidatorCompiler);
  const repo = opts.repository;
  const parser = opts.queryParser ?? new LLMQueryParser(new GeminiLLMProvider());
  const expectedKey = opts.temporaryKey ?? process.env.TEMPORARY_KEY;

  fastify.get('/', { schema: { querystring: listOffersQuerySchema } }, async (request, reply) => {
    const query = request.query as ListOffersQuery;
    const result = await repo.findAll(query);
    return replyWithEtag(request, reply, {
      items: result.items.map(toOfferDto),
      total: result.total,
      limit: query.limit,
      offset: query.offset,
    });
  });

  fastify.get('/:id', { schema: { params: getOfferParamsSchema } }, async (request, reply) => {
    const { id } = request.params as GetOfferParams;
    const offer = await repo.findById(id);
    if (!offer) {
      return reply.status(404).send({ error: 'Offer not found' });
    }
    return replyWithEtag(request, reply, toOfferDto(offer));
  });

  fastify.post('/check-existing', { schema: { body: checkExistingOffersSchema } }, async (request) => {
    const { portal, externalIds } = request.body as CheckExistingOffersInput;
    const existingIds = await repo.findExistingExternalIds(portal, externalIds);
    return { existingIds };
  });

  fastify.post('/batch', { schema: { body: batchIngestOffersSchema } }, async (request, reply) => {
    const items = (request.body as BatchIngestOffersInput).map((item) => ({
      ...item,
      price: item.price != null ? String(item.price) : null,
      areaSqm: item.areaSqm != null ? String(item.areaSqm) : null,
    }));
    const result = await repo.upsertBatch(items as unknown as NewOffer[]);
    return reply.status(201).send(result);
  });

  fastify.post('/verify-key', async (request, reply) => {
    const key = request.headers['x-temporary-key'];
    if (expectedKey && key !== expectedKey) {
      return reply.status(401).send({ ok: false, error: 'Invalid temporaryKey' });
    }
    return { ok: true };
  });

  fastify.post('/search', { schema: { body: aiSearchSchema } }, async (request, reply) => {
    if (expectedKey && request.headers['x-temporary-key'] !== expectedKey) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid or missing temporaryKey' });
    }

    const { prompt, limit, offset } = request.body as AiSearchInput;
    const filters = await parser.parse(prompt);
    const result = await repo.findAll({
      ...filters,
      limit,
      offset,
      sortBy: filters.sortBy ?? 'newest',
    });

    return {
      items: result.items.map(toOfferDto),
      total: result.total,
      limit,
      offset,
      parsedFilters: filters,
    };
  });
};
