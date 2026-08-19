import { describe, expect, it, vi } from 'vitest';
import { filterFeedItems } from '@/features/news/search/feedSearchIndex';
import { getDemoItems } from '@/features/news/services/newsData';

describe('filterFeedItems', () => {
    it('searches indexed feed text and filters categories', () => {
        const now = vi
            .spyOn(Date, 'now')
            .mockReturnValue(Date.parse('2026-05-19T15:00:00.000Z'));
        const result = filterFeedItems(getDemoItems(), {
            category: 'technology',
            source: 'all',
            time: 'week',
            query: 'queues',
        });

        expect(result.length).toBeGreaterThan(0);
        expect(
            result.every((item) => item.categories.includes('technology')),
        ).toBe(true);
        now.mockRestore();
    });
});
