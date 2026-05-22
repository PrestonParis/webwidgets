import type { EnrichedFeedItem } from '@/features/news/schemas/eventSchemas';
import { rankFeedItems } from '@/features/news/ranking/rankFeedItems';

const fixtureNow = new Date('2026-05-19T15:00:00.000Z');

const devOnlySeed: EnrichedFeedItem[] = [
    {
        id: 'dev-news-rss-platform-queues',
        type: 'news',
        source: 'rss',
        providerId: 'dev-fixture',
        sourceEventId: 'platform-queues',
        title: 'Queue-backed widgets move from polling to event ingestion',
        summary:
            'Dashboard surfaces consume normalized events instead of bespoke widget fetches.',
        contentText:
            'Queue-backed ingestion gives widgets a durable path from source payloads to ranked feed entries.',
        author: 'WebWidgets Fixture',
        publishedAt: new Date(
            fixtureNow.getTime() - 18 * 60 * 1000,
        ).toISOString(),
        ingestedAt: fixtureNow.toISOString(),
        categories: ['technology', 'productivity'],
        keywords: ['queues', 'widgets', 'events', 'orchestration'],
        urgency: 'high',
        sourcePriority: 0.86,
        reliability: { score: 0.92, failureCount: 0 },
        ai: {
            summaryStatus: 'queued',
            embeddingStatus: 'none',
            entities: ['WebWidgets'],
            topics: ['event ingestion', 'dashboard architecture'],
            modelHints: {},
        },
        relatedEventIds: [],
        actionHints: [],
        personalization: {
            affinity: 0.18,
            suppressed: false,
            reasonCodes: ['platform-interest'],
        },
    },
];

export function getDevOnlyNewsItems() {
    return rankFeedItems(devOnlySeed);
}
