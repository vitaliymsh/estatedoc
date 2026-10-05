import { eq, and, or, gte, lte, like, count, asc, desc, sql, inArray } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema.js';
import { offers, type Offer, type NewOffer } from '../db/schema.js';
import type { IOfferRepository, ListOffersResult } from './offer.repository.js';
import type { ListOffersQuery } from '../schemas/offer.js';

export class DrizzleOfferRepository implements IOfferRepository {
  constructor(private readonly db: MySql2Database<typeof schema>) {}

  async findAll(query: ListOffersQuery): Promise<ListOffersResult> {
    const conditions = [];

    if (query.q) {
      conditions.push(
        or(
          like(offers.title, `%${query.q}%`),
          like(offers.description, `%${query.q}%`),
          like(offers.city, `%${query.q}%`)
        )
      );
    }
    if (query.city) {
      conditions.push(like(offers.city, `%${query.city}%`));
    }
    if (query.portal) {
      conditions.push(eq(offers.portal, query.portal));
    }
    if (query.minPrice !== undefined) {
      conditions.push(gte(offers.price, String(query.minPrice)));
    }
    if (query.maxPrice !== undefined) {
      conditions.push(lte(offers.price, String(query.maxPrice)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByClause = desc(offers.createdAt);
    if (query.sortBy === 'price_asc') {
      orderByClause = asc(offers.price);
    } else if (query.sortBy === 'price_desc') {
      orderByClause = desc(offers.price);
    }

    const [countResult] = await this.db
      .select({ total: count() })
      .from(offers)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(offers)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(query.limit)
      .offset(query.offset);

    return {
      items,
      total: countResult?.total ?? 0,
    };
  }

  async findById(id: number): Promise<Offer | null> {
    const [result] = await this.db
      .select()
      .from(offers)
      .where(eq(offers.id, id))
      .limit(1);

    return result ?? null;
  }

  async findExistingExternalIds(portal: string, externalIds: string[]): Promise<string[]> {
    if (externalIds.length === 0) return [];
    const results = await this.db
      .select({ externalId: offers.externalId })
      .from(offers)
      .where(and(eq(offers.portal, portal), inArray(offers.externalId, externalIds)));

    return results.map((r) => r.externalId);
  }

  async upsertBatch(offersToUpsert: NewOffer[]): Promise<{ inserted: number; updated: number }> {
    if (offersToUpsert.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    await this.db
      .insert(offers)
      .values(offersToUpsert)
      .onDuplicateKeyUpdate({
        set: {
          url: sql`values(${offers.url})`,
          title: sql`values(${offers.title})`,
          price: sql`values(${offers.price})`,
          areaSqm: sql`values(${offers.areaSqm})`,
          roomsCount: sql`values(${offers.roomsCount})`,
          city: sql`values(${offers.city})`,
          description: sql`values(${offers.description})`,
          metadata: sql`values(${offers.metadata})`,
          updatedAt: sql`NOW()`,
        },
      });

    return {
      inserted: offersToUpsert.length,
      updated: 0,
    };
  }
}
