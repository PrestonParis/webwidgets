import { z } from 'zod';

export const ingestRssFeedJobSchema = z.object({
    type: z.literal('ingestRssFeed'),
    providerId: z.string(),
    url: z.string().url(),
    requestedBy: z.string().optional(),
});

export const normalizeEventJobSchema = z.object({
    type: z.literal('normalizeEvent'),
    rawEvent: z.unknown(),
});

export const enrichEventJobSchema = z.object({
    type: z.literal('enrichEvent'),
    eventId: z.string(),
});

export const refreshRankingsJobSchema = z.object({
    type: z.literal('refreshRankings'),
    scope: z.enum(['global', 'user', 'source']).default('global'),
    userId: z.string().optional(),
    providerId: z.string().optional(),
});

export const newsQueueJobSchema = z.discriminatedUnion('type', [
    ingestRssFeedJobSchema,
    normalizeEventJobSchema,
    enrichEventJobSchema,
    refreshRankingsJobSchema,
]);

export type IngestRssFeedJob = z.infer<typeof ingestRssFeedJobSchema>;
export type NewsQueueJob = z.infer<typeof newsQueueJobSchema>;
