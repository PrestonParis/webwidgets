import { describe, expect, it } from 'vitest';
import { executeUnifiedAction } from '@/features/actions/lib/actionEngine';

const runtime = { userId: 'user-test' };

describe('executeUnifiedAction', () => {
    it('rejects unvalidated action input before execution', async () => {
        const result = await executeUnifiedAction(
            {
                actionId: 'tasks.create',
                payload: {},
                approvalState: 'approved',
            },
            runtime,
        );

        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(result.code).toBe('ValidationError');
    });

    it('blocks state-altering actions without approval', async () => {
        const result = await executeUnifiedAction(
            {
                actionId: 'tasks.create',
                payload: { title: 'Needs approval' },
                approvalState: 'required',
            },
            runtime,
        );

        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(result.code).toBe('PermissionDenied');
    });

    it('cannot fabricate synchronous success for approved task actions', async () => {
        const result = await executeUnifiedAction(
            {
                actionId: 'tasks.create',
                payload: { title: 'Approved task' },
                approvalState: 'approved',
            },
            runtime,
        );

        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(result.code).toBe('QueueUnavailable');
    });

    it('fails required background actions when Redis is not configured', async () => {
        const result = await executeUnifiedAction(
            {
                actionId: 'news.parse_rss_feed',
                payload: {
                    url: 'https://example.com/rss.xml',
                    providerId: 'example',
                },
                approvalState: 'not_required',
            },
            runtime,
        );

        expect(result.status).toBe('failed');
        if (result.status !== 'failed') return;
        expect(result.code).toBe('QueueUnavailable');
    });
});
