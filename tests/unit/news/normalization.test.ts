import { describe, expect, it } from 'vitest';
import { normalizeNewsEvent } from '@/features/news/normalization/normalizeNewsEvent';

const raw = {
    source: 'rss',
    providerId: 'test-feed',
    sourceEventId: 'item-1',
    fetchedAt: '2026-05-19T12:00:00.000Z',
    payload: {
        title: 'Queue-aware event architecture lands',
        link: 'https://example.com/event-architecture',
        isoDate: '2026-05-19T11:45:00.000Z',
        contentSnippet:
            'A normalized event stream can feed widgets and agents.',
        categories: ['technology'],
        keywords: ['queue', 'events'],
        sourcePriority: 0.8,
    },
    reliability: { score: 0.9, failureCount: 0 },
};

describe('normalizeNewsEvent', () => {
    it('validates and normalizes rss payloads', () => {
        const result = normalizeNewsEvent(raw);
        expect(result.isOk()).toBe(true);
        if (result.isErr()) return;
        expect(result.value.type).toBe('news');
        expect(result.value.title).toBe('Queue-aware event architecture lands');
        expect(result.value.categories).toEqual(['technology']);
    });

    it('rejects malformed external payloads', () => {
        const result = normalizeNewsEvent({ ...raw, source: 'unknown' });
        expect(result.isErr()).toBe(true);
        if (result.isOk()) return;
        expect(result.error.type).toBe('invalid-raw-event');
    });
});
