import { describe, expect, it } from 'vitest';
import { enqueueActionJob } from '@/features/actions/lib/actionQueueClient';
import { enqueueNewsJob } from '@/features/news/queues/newsQueue';

const userId = '10000000-0000-4000-8000-000000000005';

describe('legacy queue cutover', () => {
    it('fails closed instead of trusting a browser approval envelope', async () => {
        const result = await enqueueActionJob(
            {
                actionId: 'tasks.create',
                payload: {},
                approvalState: 'approved',
                invocationMode: 'queued',
            },
            userId,
        );
        expect(result).toBeNull();
    });

    it('fails closed instead of enqueueing an undispatched news job', async () => {
        const result = await enqueueNewsJob({
            type: 'ingestRssFeed',
            providerId: 'test-feed',
            url: 'https://example.invalid/feed.xml',
            requestedBy: userId,
        });
        expect(result).toEqual({
            queued: false,
            reason: 'v1-processor-unavailable',
        });
    });
});
