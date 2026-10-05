import { eq, and, or, gte, lte, like, count, asc, desc, sql, inArray } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema.js';
import { offers, type Offer, type NewOffer } from '../db/schema.js';
import type { IOfferRepository, ListOffersResult } from './offer.repository.js';
import type { ListOffersQuery } from '../schemas/offer.js';

const CITY_ALIASES: Record<string, string> = {
  warsaw: 'Warszawa',
  cracow: 'Kraków',
  krakow: 'Kraków',
  wroclaw: 'Wrocław',
  gdansk: 'Gdańsk',
  poznan: 'Poznań',
  lodz: 'Łódź',
  wwa: 'Warszawa',
  krk: 'Kraków',
  wroc: 'Wrocław',
};

// ponytail: normalize English/short city names to canonical Polish in SQL filter
export function normalizeCityQuery(city?: string): string | undefined {
  if (!city?.trim()) return undefined;
  const trimmed = city.trim();
  return CITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

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
      const city = normalizeCityQuery(query.city);
      if (city) {
        conditions.push(like(offers.city, `%${city}%`));
      }
    }
    if (query.district) {
      conditions.push(like(offers.district, `%${query.district}%`));
    }
    if (query.portal) {
      conditions.push(eq(offers.portal, query.portal));
    }
    if (query.propertyType) {
      conditions.push(eq(offers.propertyType, query.propertyType));
    }
    if (query.transactionType) {
      conditions.push(eq(offers.transactionType, query.transactionType));
    }
    if (query.minRooms !== undefined) {
      conditions.push(gte(offers.roomsCount, query.minRooms));
    }
    if (query.maxRooms !== undefined) {
      conditions.push(lte(offers.roomsCount, query.maxRooms));
    }
    if (query.minPrice !== undefined) {
      conditions.push(gte(offers.price, String(query.minPrice)));
    }
    if (query.maxPrice !== undefined) {
      conditions.push(lte(offers.price, String(query.maxPrice)));
    }
    if (query.minArea !== undefined) {
      conditions.push(gte(offers.areaSqm, String(query.minArea)));
    }
    if (query.maxArea !== undefined) {
      conditions.push(lte(offers.areaSqm, String(query.maxArea)));
    }
    if (query.minFloor !== undefined) {
      conditions.push(gte(offers.floor, query.minFloor));
    }
    if (query.maxFloor !== undefined) {
      conditions.push(lte(offers.floor, query.maxFloor));
    }
    if (query.sellerType) {
      conditions.push(eq(offers.sellerType, query.sellerType));
    }
    if (query.marketType) {
      conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${offers.metadata}, '$.marketType')) = ${query.marketType}`);
    }
    const metaBools = ['hasElevator', 'hasBalcony', 'hasGarden', 'hasTerrace', 'hasParking', 'hasAirConditioning', 'isFurnished', 'hasBasement'] as const;
    for (const key of metaBools) {
      if (query[key] !== undefined) {
        conditions.push(sql`JSON_EXTRACT(${offers.metadata}, '$.${sql.raw(key)}') = ${query[key]}`);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortMap: Record<string, ReturnType<typeof asc>> = {
      price_asc: asc(offers.price),
      price_desc: desc(offers.price),
      area_asc: asc(offers.areaSqm),
      area_desc: desc(offers.areaSqm),
      price_sqm_asc: asc(sql`(${offers.price} / NULLIF(${offers.areaSqm}, 0))`),
      price_sqm_desc: desc(sql`(${offers.price} / NULLIF(${offers.areaSqm}, 0))`),
    };
    const orderByClause = (query.sortBy && sortMap[query.sortBy]) || desc(offers.createdAt);

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
          floor: sql`values(${offers.floor})`,
          totalFloors: sql`values(${offers.totalFloors})`,
          propertyType: sql`values(${offers.propertyType})`,
          transactionType: sql`values(${offers.transactionType})`,
          city: sql`values(${offers.city})`,
          district: sql`values(${offers.district})`,
          street: sql`values(${offers.street})`,
          sellerType: sql`values(${offers.sellerType})`,
          pricePerSqm: sql`values(${offers.pricePerSqm})`,
          images: sql`values(${offers.images})`,
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
