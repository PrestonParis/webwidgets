import { getLogger } from '@/lib/observability/logger';
import type { RawSourceEvent } from '@/features/news/types/events';

export function ingestNewsApiProvider(
    providerId: string,
): Promise<RawSourceEvent[]> {
    const fetchedAt = new Date().toISOString();
    getLogger({ component: 'news-api-adapter', providerId }).info(
        'news api provider ingest',
    );

    void fetchedAt;
    return Promise.resolve([]);
}
