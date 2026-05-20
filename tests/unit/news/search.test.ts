import { describe, expect, it } from 'vitest';
import { filterFeedItems } from '@/features/news/search/feedSearchIndex';
import { getDemoItems } from '@/features/news/services/newsData';

describe('filterFeedItems', () => {
    it('searches indexed feed text and filters categories', () => {
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
    });
});
