import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const eventSourceSchema = z.enum([
    'rss',
    'news-api',
    'email',
    'calendar',
    'finance',
    'github',
    'research',
    'recovery',
    'notification',
    'ai-insight',
    'widget-action',
    'automation',
    'internal',
]);

export const eventCategorySchema = z.enum([
    'world',
    'business',
    'technology',
    'markets',
    'research',
    'personal',
    'system',
    'health',
    'productivity',
]);

export const eventActionSchema = z.object({
    id: z.string(),
    label: z.string(),
    intent: z.enum([
        'open',
        'bookmark',
        'mute-source',
        'summarize',
        'queue-follow-up',
    ]),
    href: z.string().url().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
});

export const sourceReliabilitySchema = z.object({
    score: z.number().min(0).max(1),
    lastSuccessfulIngestAt: z.string().datetime().optional(),
    failureCount: z.number().int().min(0).default(0),
});

export const aiReadyMetadataSchema = z.object({
    summaryStatus: z
        .enum(['none', 'queued', 'ready', 'failed'])
        .default('none'),
    embeddingStatus: z
        .enum(['none', 'queued', 'ready', 'failed'])
        .default('none'),
    entities: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).optional(),
    modelHints: z.record(z.string(), z.unknown()).default({}),
});

export const rawSourceEventSchema = z.object({
    source: eventSourceSchema,
    providerId: z.string(),
    sourceEventId: z.string(),
    fetchedAt: z.string().datetime(),
    payload: z.unknown(),
    reliability: sourceReliabilitySchema,
});

export const newsEventSchema = z.object({
    id: z.string(),
    type: z.literal('news'),
    source: eventSourceSchema,
    providerId: z.string(),
    sourceEventId: z.string(),
    title: z.string().min(1),
    url: z.string().url().optional(),
    summary: z.string().optional(),
    contentText: z.string().optional(),
    author: z.string().optional(),
    publishedAt: z.string().datetime(),
    ingestedAt: z.string().datetime(),
    categories: z.array(eventCategorySchema).default(['world']),
    keywords: z.array(z.string()).default([]),
    urgency: z.enum(['low', 'normal', 'high', 'breaking']).default('normal'),
    sourcePriority: z.number().min(0).max(1).default(0.5),
    reliability: sourceReliabilitySchema,
    ai: aiReadyMetadataSchema.default({}),
});

export const timelineEventSchema = z.object({
    id: z.string(),
    eventIds: z.array(z.string()),
    label: z.string(),
    windowStart: z.string().datetime(),
    windowEnd: z.string().datetime(),
    density: z.number().int().min(1),
});

export const enrichedFeedItemSchema = newsEventSchema.extend({
    relatedEventIds: z.array(z.string()).default([]),
    actionHints: z.array(eventActionSchema).default([]),
    personalization: z
        .object({
            affinity: z.number().min(0).max(1).default(0),
            suppressed: z.boolean().default(false),
            reasonCodes: z.array(z.string()).default([]),
        })
        .default({}),
});

export const rankedFeedItemSchema = enrichedFeedItemSchema.extend({
    rankScore: z.number(),
    rankFactors: z.object({
        recency: z.number(),
        sourcePriority: z.number(),
        categoryWeight: z.number(),
        keywordRelevance: z.number(),
        urgency: z.number(),
        interactionAffinity: z.number(),
    }),
});

export const feedEventSchema = z.discriminatedUnion('type', [newsEventSchema]);

export const actionableEventSchema = rankedFeedItemSchema.extend({
    actions: z.array(eventActionSchema),
});

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

export type EventSource = z.infer<typeof eventSourceSchema>;
export type EventCategory = z.infer<typeof eventCategorySchema>;
export type RawSourceEvent = z.infer<typeof rawSourceEventSchema>;
export type NewsEvent = z.infer<typeof newsEventSchema>;
export type FeedEvent = z.infer<typeof feedEventSchema>;
export type EnrichedFeedItem = z.infer<typeof enrichedFeedItemSchema>;
export type RankedFeedItem = z.infer<typeof rankedFeedItemSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type ActionableEvent = z.infer<typeof actionableEventSchema>;
