import { mysqlTable, bigint, varchar, decimal, int, text, json, timestamp, uniqueIndex, index } from 'drizzle-orm/mysql-core';

export const offers = mysqlTable(
  'offers',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    portal: varchar('portal', { length: 32 }).notNull(),
    externalId: varchar('external_id', { length: 128 }).notNull(),
    url: text('url').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }),
    areaSqm: decimal('area_sqm', { precision: 8, scale: 2 }),
    roomsCount: int('rooms_count'),
    city: varchar('city', { length: 64 }).notNull(),
    description: text('description'),
    metadata: json('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex('portal_external_id_uidx').on(table.portal, table.externalId),
    index('city_price_idx').on(table.city, table.price),
  ]
);

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
