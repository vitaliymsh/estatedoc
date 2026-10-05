import type { Offer, NewOffer } from '../db/schema.js';
import type { IOfferRepository, ListOffersResult } from './offer.repository.js';
import type { ListOffersQuery } from '../schemas/offer.js';

export class InMemoryOfferRepository implements IOfferRepository {
  private offers: Offer[] = [];
  private nextId = 1;

  async findAll(query: ListOffersQuery): Promise<ListOffersResult> {
    let filtered = [...this.offers];

    if (query.q) {
      const qLower = query.q.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(qLower) ||
          (o.description && o.description.toLowerCase().includes(qLower)) ||
          o.city.toLowerCase().includes(qLower)
      );
    }
    if (query.city) {
      const cityLower = query.city.toLowerCase();
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

    if (query.sortBy === 'price_asc') {
      filtered.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    } else if (query.sortBy === 'price_desc') {
      filtered.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    } else {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

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
        this.offers[existingIdx] = {
          ...this.offers[existingIdx],
          ...item,
          updatedAt: now,
        } as Offer;
        updated++;
      } else {
        const newRecord: Offer = {
          id: this.nextId++,
          portal: item.portal,
          externalId: item.externalId,
          url: item.url,
          title: item.title,
          price: item.price ?? null,
          areaSqm: item.areaSqm ?? null,
          roomsCount: item.roomsCount ?? null,
          floor: item.floor ?? null,
          totalFloors: item.totalFloors ?? null,
          propertyType: item.propertyType ?? null,
          transactionType: item.transactionType ?? null,
          city: item.city,
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
        this.offers.push(newRecord);
        inserted++;
      }
    }

    return { inserted, updated };
  }
}
