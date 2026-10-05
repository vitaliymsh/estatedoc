import type { Offer, NewOffer } from '../db/schema.js';
import type { IOfferRepository, ListOffersResult } from './offer.repository.js';
import type { ListOffersQuery } from '../schemas/offer.js';
import { normalizeCityQuery } from './drizzle-offer.repository.js';

function toStoredOffer(id: number, item: NewOffer, now: Date): Offer {
  return {
    id,
    portal: item.portal,
    externalId: item.externalId,
    url: item.url,
    title: item.title,
    city: item.city,
    price: item.price ?? null,
    areaSqm: item.areaSqm ?? null,
    roomsCount: item.roomsCount ?? null,
    floor: item.floor ?? null,
    totalFloors: item.totalFloors ?? null,
    propertyType: item.propertyType ?? null,
    transactionType: item.transactionType ?? null,
    district: item.district ?? null,
    street: item.street ?? null,
    sellerType: item.sellerType ?? null,
    pricePerSqm: item.pricePerSqm ?? null,
    images: item.images ?? null,
    description: item.description ?? null,
    metadata: (item.metadata as Record<string, unknown>) ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export class InMemoryOfferRepository implements IOfferRepository {
  private offers: Offer[] = [];
  private nextId = 1;

  async findAll(query: ListOffersQuery): Promise<ListOffersResult> {
    let filtered = [...this.offers];

    if (query.city) {
      const normalized = normalizeCityQuery(query.city) || query.city;
      const cityLower = normalized.toLowerCase();
      filtered = filtered.filter((o) => o.city.toLowerCase().includes(cityLower));
    }
    if (query.district) {
      const distLower = query.district.toLowerCase();
      filtered = filtered.filter((o) => o.district && o.district.toLowerCase().includes(distLower));
    }
    if (query.portal) {
      filtered = filtered.filter((o) => o.portal === query.portal);
    }
    if (query.propertyType) {
      filtered = filtered.filter((o) => o.propertyType === query.propertyType);
    }
    if (query.transactionType) {
      filtered = filtered.filter((o) => o.transactionType === query.transactionType);
    }
    if (query.minRooms !== undefined) {
      filtered = filtered.filter((o) => o.roomsCount !== null && o.roomsCount >= query.minRooms!);
    }
    if (query.maxRooms !== undefined) {
      filtered = filtered.filter((o) => o.roomsCount !== null && o.roomsCount <= query.maxRooms!);
    }
    if (query.minPrice !== undefined) {
      filtered = filtered.filter((o) => o.price !== null && Number(o.price) >= query.minPrice!);
    }
    if (query.maxPrice !== undefined) {
      filtered = filtered.filter((o) => o.price !== null && Number(o.price) <= query.maxPrice!);
    }
    if (query.minArea !== undefined) {
      filtered = filtered.filter((o) => o.areaSqm !== null && Number(o.areaSqm) >= query.minArea!);
    }
    if (query.maxArea !== undefined) {
      filtered = filtered.filter((o) => o.areaSqm !== null && Number(o.areaSqm) <= query.maxArea!);
    }
    if (query.minFloor !== undefined) {
      filtered = filtered.filter((o) => o.floor !== null && o.floor !== undefined && o.floor >= query.minFloor!);
    }
    if (query.maxFloor !== undefined) {
      filtered = filtered.filter((o) => o.floor !== null && o.floor !== undefined && o.floor <= query.maxFloor!);
    }
    if (query.sellerType) {
      filtered = filtered.filter((o) => o.sellerType === query.sellerType);
    }
    if (query.marketType) {
      filtered = filtered.filter((o) => (o.metadata as Record<string, unknown> | null)?.marketType === query.marketType);
    }
    const metaBools = ['hasElevator', 'hasBalcony', 'hasGarden', 'hasTerrace', 'hasParking', 'hasAirConditioning', 'isFurnished', 'hasBasement'] as const;
    for (const key of metaBools) {
      if (query[key] !== undefined) {
        filtered = filtered.filter((o) => Boolean((o.metadata as Record<string, unknown> | null)?.[key]) === query[key]);
      }
    }

    const getPrice = (o: Offer) => (o.price != null ? Number(o.price) : null);
    const getArea = (o: Offer) => (o.areaSqm != null ? Number(o.areaSqm) : null);
    const getPricePerSqm = (o: Offer) => {
      const p = getPrice(o), a = getArea(o);
      return a && p != null ? p / a : null;
    };

    const qLower = query.q?.toLowerCase();
    const getQScore = (o: Offer) => {
      if (!qLower) return 0;
      if (o.title.toLowerCase().includes(qLower)) return 2;
      if ((o.description && o.description.toLowerCase().includes(qLower)) || o.city.toLowerCase().includes(qLower)) return 1;
      return 0;
    };

    const sortComparators: Record<string, (a: Offer, b: Offer) => number> = {
      price_asc: (a, b) => (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity),
      price_desc: (a, b) => (getPrice(b) ?? -Infinity) - (getPrice(a) ?? -Infinity),
      area_asc: (a, b) => (getArea(a) ?? Infinity) - (getArea(b) ?? Infinity),
      area_desc: (a, b) => (getArea(b) ?? -Infinity) - (getArea(a) ?? -Infinity),
      price_sqm_asc: (a, b) => (getPricePerSqm(a) ?? Infinity) - (getPricePerSqm(b) ?? Infinity),
      price_sqm_desc: (a, b) => (getPricePerSqm(b) ?? -Infinity) - (getPricePerSqm(a) ?? -Infinity),
    };

    const baseComparator = (query.sortBy && sortComparators[query.sortBy]) || ((a: Offer, b: Offer) => b.createdAt.getTime() - a.createdAt.getTime());

    filtered.sort((a, b) => {
      if (qLower) {
        const scoreDiff = getQScore(b) - getQScore(a);
        if (scoreDiff !== 0) return scoreDiff;
      }
      return baseComparator(a, b);
    });

    const total = filtered.length;
    const items = filtered.slice(query.offset, query.offset + query.limit);

    return { items, total };
  }

  async findById(id: number): Promise<Offer | null> {
    return this.offers.find((o) => o.id === id) ?? null;
  }

  async findExistingExternalIds(portal: string, externalIds: string[]): Promise<string[]> {
    if (externalIds.length === 0) return [];
    const idSet = new Set(externalIds);
    return this.offers
      .filter((o) => o.portal === portal && idSet.has(o.externalId))
      .map((o) => o.externalId);
  }

  async upsertBatch(offersToUpsert: NewOffer[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const item of offersToUpsert) {
      const existingIdx = this.offers.findIndex(
        (o) => o.portal === item.portal && o.externalId === item.externalId
      );

      const now = new Date();
      if (existingIdx >= 0) {
        this.offers[existingIdx] = { ...this.offers[existingIdx], ...item, updatedAt: now };
        updated++;
      } else {
        this.offers.push(toStoredOffer(this.nextId++, item, now));
        inserted++;
      }
    }

    return { inserted, updated };
  }
}
