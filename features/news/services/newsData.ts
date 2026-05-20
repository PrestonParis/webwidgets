import type { RankedFeedItem } from '@/features/news/schemas/eventSchemas';
import { rankFeedItems } from '@/features/news/ranking/rankFeedItems';
import { groupTimelineEvents } from '@/features/news/services/timeline';

const now = new Date('2026-05-19T15:00:00.000Z');

const seed = [
    {
        id: 'news-rss-platform-queues',
        type: 'news' as const,
        source: 'rss' as const,
        providerId: 'webwidgets-labs',
        sourceEventId: 'platform-queues',
        title: 'Queue-backed widgets move from polling to event ingestion',
        url: 'https://example.com/platform-queues',
        summary:
            'Dashboard surfaces are beginning to consume normalized events instead of bespoke widget fetches.',
        contentText:
            'Queue-backed ingestion gives widgets a durable path from source payloads to ranked feed entries.',
        author: 'WebWidgets Research',
        publishedAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
        ingestedAt: now.toISOString(),
        categories: ['technology' as const, 'productivity' as const],
        keywords: ['queues', 'widgets', 'events', 'orchestration'],
        urgency: 'high' as const,
        sourcePriority: 0.86,
        reliability: { score: 0.92, failureCount: 0 },
        ai: {
            summaryStatus: 'queued' as const,
            embeddingStatus: 'none' as const,
            entities: ['WebWidgets'],
            topics: ['event ingestion', 'dashboard architecture'],
            modelHints: { summarizer: 'future-ai-sdk-instructor' },
        },
        relatedEventIds: [],
        actionHints: [],
        personalization: {
            affinity: 0.18,
            suppressed: false,
            reasonCodes: ['platform-interest'],
        },
    },
    {
        id: 'news-markets-volatility',
        type: 'news' as const,
        source: 'news-api' as const,
        providerId: 'markets-placeholder',
        sourceEventId: 'volatility-open',
        title: 'Market alerts show elevated volatility before the open',
        url: 'https://example.com/markets-volatility',
        summary:
            'A placeholder market alert demonstrates how finance events can share the feed contract.',
        publishedAt: new Date(now.getTime() - 92 * 60 * 1000).toISOString(),
        ingestedAt: now.toISOString(),
        categories: ['markets' as const, 'business' as const],
        keywords: ['markets', 'volatility', 'alerts'],
        urgency: 'normal' as const,
        sourcePriority: 0.72,
        reliability: { score: 0.82, failureCount: 1 },
        ai: {
            summaryStatus: 'none' as const,
            embeddingStatus: 'none' as const,
            entities: [],
            topics: ['markets'],
            modelHints: {},
        },
        relatedEventIds: [],
        actionHints: [],
        personalization: { affinity: 0.08, suppressed: false, reasonCodes: [] },
    },
    {
        id: 'news-research-agent-metadata',
        type: 'news' as const,
        source: 'research' as const,
        providerId: 'internal-research',
        sourceEventId: 'agent-metadata',
        title: 'Research ingestion adds AI-ready metadata fields',
        url: 'https://example.com/research-agent-metadata',
        summary:
            'Entity, topic, summary, and embedding states are now explicit in normalized feed items.',
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        ingestedAt: now.toISOString(),
        categories: ['research' as const, 'technology' as const],
        keywords: ['metadata', 'agents', 'embeddings'],
        urgency: 'normal' as const,
        sourcePriority: 0.78,
        reliability: { score: 0.88, failureCount: 0 },
        ai: {
            summaryStatus: 'ready' as const,
            embeddingStatus: 'queued' as const,
            entities: ['AI agents'],
            topics: ['metadata', 'research ingestion'],
            modelHints: { vectorStoreFuture: 'pgvector-or-external-vector-db' },
        },
        relatedEventIds: [],
        actionHints: [],
        personalization: {
            affinity: 0.14,
            suppressed: false,
            reasonCodes: ['research'],
        },
    },
];

export function getDemoNewsFeed() {
    const ranked = rankFeedItems(seed);
    const payload = {
        items: ranked,
        timelines: groupTimelineEvents(ranked),
        generatedAt: new Date().toISOString(),
        sourceCount: new Set(ranked.map((item) => item.providerId)).size,
    };

    return payload;
}

export function getDemoItems(): RankedFeedItem[] {
    return getDemoNewsFeed().items;
}
