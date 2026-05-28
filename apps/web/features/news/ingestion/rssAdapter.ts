import { Readability } from '@mozilla/readability';
import Parser from 'rss-parser';
import { getLogger, traced } from '@/lib/observability/logger';
import { getProviderLimiter } from '@/features/news/ingestion/rateLimiters';
import { rawSourceEventSchema } from '@/features/news/schemas/eventCoreSchemas';
import type { RawSourceEvent } from '@/features/news/types/events';

const parser = new Parser();

function extractReadableText(html: string | undefined) {
    if (!html || typeof DOMParser === 'undefined') return undefined;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return new Readability(doc).parse()?.textContent ?? undefined;
}

export async function ingestRssFeed(
    providerId: string,
    url: string,
): Promise<RawSourceEvent[]> {
    const log = getLogger({ component: 'rss-adapter', providerId, url });
    const limiter = getProviderLimiter(providerId);

    return traced(
        'news.rss.fetch',
        async () => {
            const feed = await limiter.schedule(() => parser.parseURL(url));
            const fetchedAt = new Date().toISOString();
            log.info({ itemCount: feed.items.length }, 'rss feed fetched');

            return feed.items.map((item, index) =>
                rawSourceEventSchema.parse({
                    source: 'rss',
                    providerId,
                    sourceEventId: item.guid ?? item.link ?? `${url}#${index}`,
                    fetchedAt,
                    payload: {
                        ...item,
                        contentText: extractReadableText(
                            typeof item['content:encoded'] === 'string'
                                ? item['content:encoded']
                                : item.content,
                        ),
                        sourcePriority: 0.65,
                    },
                    reliability: {
                        score: 0.8,
                        lastSuccessfulIngestAt: fetchedAt,
                        failureCount: 0,
                    },
                }),
            );
        },
        { providerId },
    );
}
