import { z } from 'zod';
import { eventCategorySchema, eventSourceSchema } from './eventEnumSchemas';
import {
    aiReadyMetadataSchema,
    eventActionSchema,
    sourceReliabilitySchema,
} from './eventMetadataSchemas';

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
    ai: aiReadyMetadataSchema.default({
        summaryStatus: 'none',
        embeddingStatus: 'none',
        entities: [],
        topics: [],
        modelHints: {},
    }),
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
        .default({ affinity: 0, suppressed: false, reasonCodes: [] }),
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
