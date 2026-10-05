import { createHash } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import type { IOfferRepository } from '../repositories/offer.repository.js';
import {
  listOffersQuerySchema,
  getOfferParamsSchema,
  batchIngestOffersSchema,
  checkExistingOffersSchema,
  aiSearchSchema,
} from '../schemas/offer.js';
import type { IQueryParser } from '../services/query-parser.js';
import { LLMQueryParser } from '../services/query-parser.js';
import { GeminiLLMProvider } from '../services/llm/gemini-llm-provider.js';

function computeETag(data: unknown): string {
  return `"${createHash('sha1').update(JSON.stringify(data)).digest('hex')}"`;
}

export interface OffersRoutesOptions {
  repository: IOfferRepository;
  queryParser?: IQueryParser;
}

export const offersRoutes: FastifyPluginAsync<OffersRoutesOptions> = async (fastify, opts) => {
  const repo = opts.repository;
  const parser = opts.queryParser ?? new LLMQueryParser(new GeminiLLMProvider());

  fastify.get('/', async (request, reply) => {
    const parsed = listOffersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query parameters', details: parsed.error.issues });
    }
    const result = await repo.findAll(parsed.data);
    const body = {
      items: result.items,
      total: result.total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    };

    const etag = computeETag(body);
    reply.header('Cache-Control', 'public, max-age=60');
    reply.header('ETag', etag);

    if (request.headers['if-none-match'] === etag) {
      return reply.status(304).send();
    }

    return body;
  });

  fastify.get('/:id', async (request, reply) => {
    const parsed = getOfferParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid ID parameter', details: parsed.error.issues });
    }
    const offer = await repo.findById(parsed.data.id);
    if (!offer) {
      return reply.status(404).send({ error: 'Offer not found' });
    }

    const etag = computeETag(offer);
    reply.header('Cache-Control', 'public, max-age=60');
    reply.header('ETag', etag);

    if (request.headers['if-none-match'] === etag) {
      return reply.status(304).send();
    }

    return offer;
  });


  fastify.post('/check-existing', async (request, reply) => {
    const parsed = checkExistingOffersSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid check payload', details: parsed.error.issues });
    }
    const existingIds = await repo.findExistingExternalIds(parsed.data.portal, parsed.data.externalIds);
    return { existingIds };
  });

  fastify.post('/batch', async (request, reply) => {
    const parsed = batchIngestOffersSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid batch payload', details: parsed.error.issues });
    }
    const normalizedOffers = parsed.data.map((item) => ({
      portal: item.portal,
      externalId: item.externalId,
      url: item.url,
      title: item.title,
      price: item.price !== undefined && item.price !== null ? String(item.price) : null,
      areaSqm: item.areaSqm !== undefined && item.areaSqm !== null ? String(item.areaSqm) : null,
      roomsCount: item.roomsCount ?? null,
      floor: item.floor ?? null,
      totalFloors: item.totalFloors ?? null,
      propertyType: item.propertyType ?? null,
      transactionType: item.transactionType ?? null,
      city: item.city,
      district: item.district ?? null,
      street: item.street ?? null,
      sellerType: item.sellerType ?? null,
      images: item.images ?? null,
      description: item.description ?? null,
      metadata: item.metadata ?? null,
    }));
    const result = await repo.upsertBatch(normalizedOffers);
    return reply.status(201).send(result);
  });

  fastify.post('/search', async (request, reply) => {
    const parsed = aiSearchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid search payload', details: parsed.error.issues });
    }

    const filters = await parser.parse(parsed.data.prompt);
    const result = await repo.findAll({
      ...filters,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      sortBy: filters.sortBy ?? 'newest',
    });

    return {
      items: result.items,
      total: result.total,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      parsedFilters: filters,
    };
  });
};
