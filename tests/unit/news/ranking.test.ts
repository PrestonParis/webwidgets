import { describe, expect, it } from 'vitest';
import { rankFeedItems } from '@/features/news/ranking/rankFeedItems';
import type { EnrichedFeedItem } from '@/features/news/schemas/eventTypes';

function item(
    id: string,
    overrides: Partial<EnrichedFeedItem>,
): EnrichedFeedItem {
    return {
        id,
        type: 'news',
        source: 'rss',
        providerId: 'test',
        sourceEventId: id,
        title: id,
        publishedAt: '2026-05-19T12:00:00.000Z',
        ingestedAt: '2026-05-19T12:01:00.000Z',
        categories: ['world'],
        keywords: [],
        urgency: 'normal',
        sourcePriority: 0.5,
        reliability: { score: 0.8, failureCount: 0 },
        ai: {
            summaryStatus: 'none',
            embeddingStatus: 'none',
            entities: [],
            topics: [],
            modelHints: {},
        },
        relatedEventIds: [],
        actionHints: [],
        personalization: { affinity: 0, suppressed: false, reasonCodes: [] },
        ...overrides,
    };
}

describe('rankFeedItems', () => {
    it('orders high urgency and source priority above weaker entries', () => {
        const ranked = rankFeedItems(
            [
                item('slow', { sourcePriority: 0.2, urgency: 'low' }),
                item('important', {
                    sourcePriority: 0.95,
                    urgency: 'breaking',
                    categories: ['technology'],
                    keywords: ['queue'],
                }),
            ],
            new Date('2026-05-19T12:05:00.000Z').getTime(),
        );

        expect(ranked[0]?.id).toBe('important');
        expect(ranked[0]?.rankScore).toBeGreaterThan(ranked[1]?.rankScore ?? 0);
    });
});
