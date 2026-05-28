import { err, ok, type Result } from 'neverthrow';
import { ZodError } from 'zod';
import {
    newsEventSchema,
    rawSourceEventSchema,
} from '@/features/news/schemas/eventCoreSchemas';
import type {
    NewsEvent,
    RawSourceEvent,
} from '@/features/news/schemas/eventTypes';

export type NormalizationError =
    | { type: 'invalid-raw-event'; message: string; issues?: unknown }
    | { type: 'invalid-normalized-event'; message: string; issues?: unknown };

function hashId(input: string) {
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function messageFrom(error: unknown) {
    return error instanceof Error
        ? error.message
        : 'Unknown normalization error';
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : undefined;
}

export function normalizeNewsEvent(
    raw: unknown,
): Result<NewsEvent, NormalizationError> {
    const parsedRaw = rawSourceEventSchema.safeParse(raw);
    if (!parsedRaw.success) {
        return err({
            type: 'invalid-raw-event',
            message: 'Raw source event failed schema validation',
            issues: parsedRaw.error.flatten(),
        });
    }

    const source = parsedRaw.data;
    try {
        const payload = source.payload as Record<string, unknown>;
        const title =
            optionalString(payload.title ?? payload.headline)?.trim() ?? '';
        const link =
            typeof payload.link === 'string'
                ? payload.link
                : typeof payload.url === 'string'
                  ? payload.url
                  : undefined;
        const publishedAt =
            typeof payload.isoDate === 'string'
                ? payload.isoDate
                : typeof payload.publishedAt === 'string'
                  ? payload.publishedAt
                  : source.fetchedAt;

        const event = newsEventSchema.parse({
            id: `news_${hashId(`${source.providerId}:${source.sourceEventId}`)}`,
            type: 'news',
            source: source.source,
            providerId: source.providerId,
            sourceEventId: source.sourceEventId,
            title,
            url: link,
            summary:
                typeof payload.contentSnippet === 'string'
                    ? payload.contentSnippet
                    : typeof payload.summary === 'string'
                      ? payload.summary
                      : undefined,
            contentText:
                typeof payload.contentText === 'string'
                    ? payload.contentText
                    : undefined,
            author:
                typeof payload.creator === 'string'
                    ? payload.creator
                    : undefined,
            publishedAt,
            ingestedAt: source.fetchedAt,
            categories: Array.isArray(payload.categories)
                ? payload.categories
                : ['world'],
            keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
            urgency: payload.urgency ?? 'normal',
            sourcePriority:
                typeof payload.sourcePriority === 'number'
                    ? payload.sourcePriority
                    : 0.5,
            reliability: source.reliability,
            ai: {
                summaryStatus: 'none',
                embeddingStatus: 'none',
                entities: [],
                topics: Array.isArray(payload.categories)
                    ? payload.categories
                    : [],
                modelHints: {},
            },
        });

        return ok(event);
    } catch (error) {
        return err({
            type: 'invalid-normalized-event',
            message: messageFrom(error),
            issues: error instanceof ZodError ? error.flatten() : undefined,
        });
    }
}

export function normalizeRawSourceEvent(raw: RawSourceEvent) {
    return normalizeNewsEvent(raw);
}
