import { z } from 'zod';

export const sourceHealthSchema = z.enum([
    'connected',
    'syncing',
    'healthy',
    'stale',
    'failing',
    'disabled',
    'reconnect_required',
]);

export const timelineFeedItemSchema = z.object({
    id: z.string().uuid(),
    eventType: z.string(),
    sourceType: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    occurredAt: z.string().datetime(),
    ingestedAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    state: z.string(),
    revision: z.number().int(),
    sourceLabel: z.string(),
    sourceUrl: z.string().url().nullable(),
    sourceRecordTable: z.string().nullable(),
    sourceRecordId: z.string().nullable(),
    relatedStoryKey: z.string().nullable(),
    relatedEvents: z.array(
        z.object({ id: z.string().uuid(), title: z.string() }),
    ),
});

export const timelineFeedResponseSchema = z.object({
    items: z.array(timelineFeedItemSchema),
    availableSourceTypes: z.array(z.string()),
    availableEventTypes: z.array(z.string()),
    sources: z.array(
        z.object({
            id: z.string().uuid(),
            providerId: z.string(),
            label: z.string(),
            health: sourceHealthSchema,
            lastCheckedAt: z.string().datetime().nullable(),
            lastSucceededAt: z.string().datetime().nullable(),
            nextSyncAt: z.string().datetime().nullable(),
            failureCount: z.number().int().min(0),
            issueCode: z.string().nullable(),
        }),
    ),
    generatedAt: z.string().datetime(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    sourceHealthUnavailable: z.boolean(),
});

const filterValueSchema = z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9._:-]+$/);

function csvFilter(value: string | null): string[] {
    if (!value) return [];
    return z
        .array(filterValueSchema)
        .max(8)
        .parse(value.split(',').filter(Boolean));
}

const optionalDateSchema = z.string().datetime({ offset: true }).optional();

export const timelineQuerySchema = z
    .object({
        limit: z.coerce.number().int().min(1).max(50).default(25),
        cursor: z.string().min(1).max(512).optional(),
        from: optionalDateSchema,
        to: optionalDateSchema,
        sourceTypes: z.array(filterValueSchema).max(8),
        eventTypes: z.array(filterValueSchema).max(8),
    })
    .refine(({ from, to }) => !from || !to || new Date(from) <= new Date(to), {
        message: 'The start date must precede the end date',
    });

export type TimelineQuery = z.infer<typeof timelineQuerySchema>;

export function parseTimelineQuery(url: URL): TimelineQuery {
    return timelineQuerySchema.parse({
        limit: url.searchParams.get('limit') ?? undefined,
        cursor: url.searchParams.get('cursor') ?? undefined,
        from: url.searchParams.get('from') ?? undefined,
        to: url.searchParams.get('to') ?? undefined,
        sourceTypes: csvFilter(url.searchParams.get('sources')),
        eventTypes: csvFilter(url.searchParams.get('events')),
    });
}
