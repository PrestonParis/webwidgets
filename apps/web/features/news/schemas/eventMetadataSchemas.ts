import { z } from 'zod';

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
