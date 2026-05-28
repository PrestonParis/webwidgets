import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const normalizedEventTable = pgTable('normalized_events', {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    source: text('source').notNull(),
    providerId: text('provider_id').notNull(),
    sourceEventId: text('source_event_id').notNull(),
    title: text('title').notNull(),
    url: text('url'),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull(),
    rankScore: integer('rank_score'),
    metadata: jsonb('metadata').notNull(),
});

export const insertNormalizedEventSchema =
    createInsertSchema(normalizedEventTable);
export const selectNormalizedEventSchema =
    createSelectSchema(normalizedEventTable);
