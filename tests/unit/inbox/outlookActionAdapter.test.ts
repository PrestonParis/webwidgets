import { describe, expect, it, vi } from 'vitest';
import { executeOutlookAction } from '@/lib/emailActions/outlookAdapter';
import { emailCorrelationId } from '@/lib/emailActions/gmailMime';
import { OutlookActionError } from '@/lib/emailActions/outlookTransport';
import type { EmailMessage } from '@/lib/emailActions/contracts';

const requestId = '51111111-1111-4111-8111-111111111111';
const message: EmailMessage = {
    provider: 'microsoft',
    accountId: '52222222-2222-4222-8222-222222222222',
    from: 'owner@example.invalid',
    to: ['recipient@example.invalid'],
    cc: [],
    bcc: [],
    subject: 'Outlook fixture',
    body: 'Fixture',
    reply: null,
};
const profile = { mail: message.from, userPrincipalName: message.from };
const draft = {
    id: 'immutable-1',
    internetMessageId: emailCorrelationId(requestId),
    conversationId: 'thread-1',
    isDraft: true,
};
const sent = { ...draft, isDraft: false };
const input = (
    actionId: 'email.draft' | 'email.send',
    dispatchAllowed = true,
) => ({ requestId, actionId, message, dispatchAllowed });

describe('Outlook one-shot adapter', () => {
    it('creates and verifies a draft without sending', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(draft)
            .mockResolvedValueOnce(draft);
        const checkpoint = vi.fn().mockResolvedValue(undefined);
        expect(
            await executeOutlookAction(api, input('email.draft'), checkpoint),
        ).toMatchObject({ state: 'verified', providerObjectId: 'immutable-1' });
        expect(checkpoint).toHaveBeenCalledWith('prepared', 'immutable-1');
        expect(
            api.mock.calls.some(([path]) => String(path).endsWith('/send')),
        ).toBe(false);
    });
    it('checkpoints the immutable draft before separately sending', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(draft)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(sent);
        const checkpoint = vi.fn().mockResolvedValue(undefined);
        expect(
            await executeOutlookAction(api, input('email.send'), checkpoint),
        ).toMatchObject({
            state: 'verified',
            code: 'sent_verified_not_delivery',
        });
        expect(checkpoint.mock.calls).toEqual([
            ['prepared', 'immutable-1'],
            ['dispatching', 'immutable-1'],
        ]);
        expect(api.mock.calls[2]?.[0]).toContain('/send');
    });
    it('reconciles a prior dispatch only by immutable ID', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(sent);
        const checkpoint = vi.fn();
        expect(
            await executeOutlookAction(
                api,
                {
                    ...input('email.send', false),
                    providerObjectId: 'immutable-1',
                },
                checkpoint,
            ),
        ).toMatchObject({ state: 'verified' });
        expect(checkpoint).not.toHaveBeenCalled();
        expect(api.mock.calls.every((call) => call.length === 1)).toBe(true);
    });
    it('never sends again when the reserved outcome lacks an ID', async () => {
        const api = vi.fn().mockResolvedValueOnce(profile);
        expect(
            await executeOutlookAction(
                api,
                input('email.send', false),
                vi.fn(),
            ),
        ).toMatchObject({ state: 'unknown' });
        expect(api).toHaveBeenCalledTimes(1);
    });
    it('reports a definite send rejection and keeps its draft reference', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(draft)
            .mockRejectedValueOnce(new OutlookActionError(403));
        expect(
            await executeOutlookAction(api, input('email.send'), vi.fn()),
        ).toMatchObject({ state: 'failed', providerObjectId: 'immutable-1' });
    });
    it('keeps an accepted send unknown until Sent Items verifies it', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(draft)
            .mockResolvedValueOnce(null)
            .mockRejectedValueOnce(new OutlookActionError(404));
        expect(
            await executeOutlookAction(api, input('email.send'), vi.fn()),
        ).toMatchObject({ state: 'unknown', providerObjectId: 'immutable-1' });
    });
    it('checks account identity before draft or send writes', async () => {
        const api = vi
            .fn()
            .mockResolvedValue({ mail: 'other@example.invalid' });
        expect(
            await executeOutlookAction(api, input('email.send'), vi.fn()),
        ).toMatchObject({ state: 'failed' });
        expect(api).toHaveBeenCalledTimes(1);
    });
    it('blocks unsupported Outlook reply composition before writing', async () => {
        const api = vi.fn().mockResolvedValueOnce(profile);
        const reply = {
            providerMessageId: 'original',
            threadId: 'thread',
            inReplyTo: '<original@example.invalid>',
            references: [],
        };
        expect(
            await executeOutlookAction(
                api,
                { ...input('email.draft'), message: { ...message, reply } },
                vi.fn(),
            ),
        ).toMatchObject({ state: 'failed' });
        expect(api).toHaveBeenCalledTimes(1);
    });
});
