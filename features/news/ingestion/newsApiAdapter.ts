import { getLogger } from '@/lib/observability/logger';
import {
    rawSourceEventSchema,
    type RawSourceEvent,
} from '@/features/news/schemas/eventSchemas';

export async function ingestNewsApiPlaceholder(
    providerId: string,
): Promise<RawSourceEvent[]> {
    const fetchedAt = new Date().toISOString();
    getLogger({ component: 'news-api-adapter', providerId }).info(
        'news api placeholder ingest',
    );

    return [
        rawSourceEventSchema.parse({
            source: 'news-api',
            providerId,
            sourceEventId: `${providerId}:${fetchedAt}`,
            fetchedAt,
            payload: {
                title: 'Provider adapter ready for external news API events',
                url: 'https://example.com/news-api-adapter',
                publishedAt: fetchedAt,
                categories: ['technology'],
                keywords: ['adapter', 'provider', 'events'],
                sourcePriority: 0.58,
            },
            reliability: { score: 0.72, failureCount: 0 },
        }),
    ];
}
