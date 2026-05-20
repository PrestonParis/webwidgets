import { describe, expect, it } from 'vitest';
import { newsQueueJobSchema } from '@/features/news/schemas/ingestionSchemas';

describe('newsQueueJobSchema', () => {
    it('validates rss ingest jobs before they reach BullMQ', () => {
        const job = newsQueueJobSchema.parse({
            type: 'ingestRssFeed',
            providerId: 'test-feed',
            url: 'https://example.com/rss.xml',
        });

        expect(job.type).toBe('ingestRssFeed');
    });

    it('rejects invalid job URLs', () => {
        expect(() =>
            newsQueueJobSchema.parse({
                type: 'ingestRssFeed',
                providerId: 'test-feed',
                url: 'not-a-url',
            }),
        ).toThrow();
    });
});
