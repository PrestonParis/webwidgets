import { describe, expect, it } from 'vitest';
import { executeUnifiedAction } from '@/features/actions/lib/actionEngine';

const runtime = { userId: 'user-test' };

describe('executeUnifiedAction', () => {
    it.each([
        {
            actionId: 'email.draft',
            payload: {
                provider: 'google',
                accountId: '10000000-0000-4000-8000-000000000001',
                from: 'owner@example.invalid',
                to: ['recipient@example.invalid'],
                subject: 'Fixture draft',
                body: 'Fixture body',
            },
        },
        {
            actionId: 'calendar.create_event',
            payload: {
                title: 'Fixture event',
                startsAt: '2026-09-01T12:00:00Z',
                endsAt: '2026-09-01T13:00:00Z',
            },
        },
        {
            actionId: 'automation.run',
            payload: { automationId: 'fixture-workflow' },
        },
    ])(
        'never reports fake success for $actionId through a caller-approved envelope',
        async ({ actionId, payload }) => {
            const result = await executeUnifiedAction(
                {
                    actionId,
                    payload,
                    approvalState: 'approved',
                    invocationMode: 'sync',
                },
                runtime,
            );
            expect(result.status).toBe('failed');
            if (result.status !== 'failed') return;
            expect(result.code).toBe('ExecutionFault');
            expect(result.message).toContain(
                'No provider action was performed',
            );
        },
    );

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
