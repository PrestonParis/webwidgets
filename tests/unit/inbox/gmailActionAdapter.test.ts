import { describe, expect, it, vi } from 'vitest';
import { executeGmailAction } from '@/lib/emailActions/gmailAdapter';
import {
    approvedGmailRaw,
    emailCorrelationId,
} from '@/lib/emailActions/gmailMime';
import {
    GmailActionError,
    gmailTransport,
} from '@/lib/emailActions/gmailTransport';
import type { EmailActionId, EmailMessage } from '@/lib/emailActions/contracts';

const requestId = '41111111-1111-4111-8111-111111111111';
const message: EmailMessage = {
    provider: 'google',
    accountId: '42222222-2222-4222-8222-222222222222',
    from: 'sender@example.invalid',
    to: ['recipient@example.invalid'],
    cc: ['cc@example.invalid'],
    bcc: ['bcc@example.invalid'],
    subject: 'Test café',
    body: 'Hello\n世界',
    reply: null,
};
const providerMessage = (label: string) => ({
    id: 'message-1',
    threadId: 'thread-1',
    labelIds: [label],
    payload: {
        headers: [{ name: 'Message-ID', value: emailCorrelationId(requestId) }],
    },
});
const input = (actionId: EmailActionId, dispatchAllowed = true) => ({
    requestId,
    actionId,
    message,
    dispatchAllowed,
});
const profile = { emailAddress: message.from };

describe('Gmail approved payload encoding', () => {
    it('preserves exact body, all recipients, and correlation in bounded MIME', () => {
        const raw = Buffer.from(
            approvedGmailRaw(requestId, message),
            'base64url',
        ).toString();
        expect(raw).toContain(`Bcc: ${message.bcc[0]}`);
        expect(raw).toContain(`Cc: ${message.cc[0]}`);
        expect(raw).toContain(`Message-ID: ${emailCorrelationId(requestId)}`);
        expect(
            Buffer.from(raw.split('\r\n\r\n')[1]!, 'base64').toString(),
        ).toBe(message.body);
        expect(raw).toContain(Buffer.from(message.subject).toString('base64'));
    });
    it('folds Unicode subjects without breaking characters or encoded-word limits', () => {
        const subject = '🌍'.repeat(100);
        const raw = Buffer.from(
            approvedGmailRaw(requestId, { ...message, subject }),
            'base64url',
        ).toString();
        const words = raw.match(/=\?UTF-8\?B\?.*?\?=/gu)!;
        expect(words.every((word) => word.length <= 75)).toBe(true);
        expect(
            words
                .map((word) =>
                    Buffer.from(word.slice(10, -2), 'base64').toString(),
                )
                .join(''),
        ).toBe(subject);
    });
});

describe('Gmail one-shot adapter', () => {
    it('creates a draft, reads it back, and never calls send', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ id: 'draft-1' })
            .mockResolvedValueOnce({ message: providerMessage('DRAFT') });
        expect(
            await executeGmailAction(api, input('email.draft')),
        ).toMatchObject({
            state: 'verified',
            providerObjectId: 'draft-1',
            code: 'draft_verified',
        });
        expect(api.mock.calls[1]?.[0]).toBe('drafts');
        expect(
            api.mock.calls.some(([path]) => String(path).includes('/send')),
        ).toBe(false);
    });
    it('sends exact approved raw content then verifies SENT without claiming delivery', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ id: 'message-1' })
            .mockResolvedValueOnce(providerMessage('SENT'));
        expect(
            await executeGmailAction(api, input('email.send')),
        ).toMatchObject({
            state: 'verified',
            code: 'sent_verified_not_delivery',
        });
        expect(api.mock.calls[1]).toEqual([
            'messages/send',
            { raw: approvedGmailRaw(requestId, message) },
        ]);
    });
    it('checks identity before writing; never falls back to another account', async () => {
        const api = vi
            .fn()
            .mockResolvedValue({ emailAddress: 'other@example.invalid' });
        expect(
            await executeGmailAction(api, input('email.send')),
        ).toMatchObject({ state: 'failed' });
        expect(api).toHaveBeenCalledTimes(1);
    });
    it.each([null, 500, 503])(
        'never retries an ambiguous write (%s)',
        async (status) => {
            const api = vi
                .fn()
                .mockResolvedValueOnce(profile)
                .mockRejectedValueOnce(new GmailActionError(status));
            expect(
                await executeGmailAction(api, input('email.send')),
            ).toMatchObject({ state: 'unknown', providerObjectId: null });
            expect(api).toHaveBeenCalledTimes(2);
        },
    );
    it.each([400, 401, 403, 429])(
        'reports definite rejection without a resend (%s)',
        async (status) => {
            const api = vi
                .fn()
                .mockResolvedValueOnce(profile)
                .mockRejectedValueOnce(new GmailActionError(status));
            expect(
                await executeGmailAction(api, input('email.send')),
            ).toMatchObject({ state: 'failed' });
            expect(api).toHaveBeenCalledTimes(2);
        },
    );
    it('preserves provider ID when read-back fails after a successful write', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ id: 'message-1' })
            .mockRejectedValueOnce(new GmailActionError(403));
        expect(
            await executeGmailAction(api, input('email.send')),
        ).toMatchObject({ state: 'unknown', providerObjectId: 'message-1' });
    });
    it('reconciles duplicate delivery using reads only', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ messages: [{ id: 'message-1' }] })
            .mockResolvedValueOnce(providerMessage('SENT'));
        expect(
            await executeGmailAction(api, input('email.send', false)),
        ).toMatchObject({ state: 'verified' });
        expect(api.mock.calls.every((call) => call.length === 1)).toBe(true);
    });
    it('keeps an absent reconciliation result unknown rather than sending again', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ messages: [] });
        expect(
            await executeGmailAction(api, input('email.send', false)),
        ).toMatchObject({ state: 'unknown' });
        expect(api.mock.calls.every((call) => call.length === 1)).toBe(true);
    });
    it('does not accept a receipt lacking the SENT label', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce({ id: 'message-1' })
            .mockResolvedValueOnce(providerMessage('DRAFT'));
        expect(
            await executeGmailAction(api, input('email.send')),
        ).toMatchObject({ state: 'unknown' });
    });
    it('blocks a changed reply thread before any write', async () => {
        const api = vi
            .fn()
            .mockResolvedValueOnce(profile)
            .mockResolvedValueOnce(providerMessage('INBOX'));
        const reply = {
            providerMessageId: 'original',
            threadId: 'other-thread',
            inReplyTo: '<original@example.invalid>',
            references: [],
        };
        expect(
            await executeGmailAction(api, {
                ...input('email.send'),
                message: { ...message, reply },
            }),
        ).toMatchObject({ state: 'failed' });
        expect(api.mock.calls.every((call) => call.length === 1)).toBe(true);
    });
});

describe('Gmail transport', () => {
    it('does not leak provider error content or retry a failed request', async () => {
        const fetcher = vi
            .fn()
            .mockResolvedValue(
                new Response('sensitive provider detail', { status: 503 }),
            );
        vi.stubGlobal('fetch', fetcher);
        try {
            await expect(
                gmailTransport('fixture-token')('messages/send', {}),
            ).rejects.toThrow('gmail_action_request_failed');
            expect(fetcher).toHaveBeenCalledTimes(1);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
