import { describe, expect, it } from 'vitest';
import {
    emailMessageSchema,
    hasEmailActionScope,
} from '@/lib/emailActions/contracts';
import { hashJson } from '@/lib/lifecycle/idempotency';

const message = {
    provider: 'google' as const,
    accountId: '41111111-1111-4111-8111-111111111111',
    from: 'sender@example.invalid',
    to: ['recipient@example.invalid'],
    cc: [],
    bcc: [],
    subject: 'Fixture subject',
    body: 'Fixture message',
    reply: null,
};

describe('exact-message approval contract', () => {
    it('accepts a bounded plain-text message', () => {
        expect(emailMessageSchema.parse(message)).toEqual(message);
    });
    it.each([
        { subject: 'subject\r\nBcc: attacker@example.invalid' },
        { subject: 'subject\r\n' },
        { to: ['recipient@example.invalid\nBcc: attacker@example.invalid'] },
        { bcc: Array.from({ length: 20 }, () => 'recipient@example.invalid') },
        { attachments: ['unapproved.txt'] },
        { body: 'bad\0body' },
        { to: [] },
    ])('rejects malformed or unapproved fields', (change) => {
        expect(
            emailMessageSchema.safeParse({ ...message, ...change }).success,
        ).toBe(false);
    });
    it.each([
        { provider: 'microsoft' },
        { accountId: '42222222-2222-4222-8222-222222222222' },
        { from: 'another@example.invalid' },
        { to: ['other@example.invalid'] },
        { cc: ['other@example.invalid'] },
        { bcc: ['other@example.invalid'] },
        { subject: 'Changed' },
        { body: 'Changed' },
        {
            reply: {
                providerMessageId: 'original',
                threadId: 'thread',
                inReplyTo: '<original@example.invalid>',
                references: [],
            },
        },
    ])(
        'changes the approval hash when any message field changes',
        async (change) => {
            const originalHash = await hashJson(message);
            expect(await hashJson({ ...message, ...change })).not.toBe(
                originalHash,
            );
        },
    );
});

describe('actual granted email permissions', () => {
    it('does not infer write or send permission from read access', () => {
        expect(
            hasEmailActionScope('google', 'email.draft', ['gmail.readonly']),
        ).toBe(false);
        expect(
            hasEmailActionScope('google', 'email.send', ['gmail.readonly']),
        ).toBe(false);
        expect(
            hasEmailActionScope('microsoft', 'email.send', ['Mail.ReadWrite']),
        ).toBe(false);
    });
    it('separates draft and send requirements without provider fallback', () => {
        expect(
            hasEmailActionScope('google', 'email.draft', [
                'gmail.readonly',
                'gmail.send',
            ]),
        ).toBe(false);
        expect(
            hasEmailActionScope('google', 'email.send', [
                'gmail.readonly',
                'gmail.send',
            ]),
        ).toBe(true);
        expect(
            hasEmailActionScope('google', 'email.draft', [
                'gmail.readonly',
                'gmail.compose',
            ]),
        ).toBe(true);
        expect(
            hasEmailActionScope('microsoft', 'email.draft', ['Mail.ReadWrite']),
        ).toBe(true);
        expect(
            hasEmailActionScope('microsoft', 'email.send', [
                'Mail.ReadWrite',
                'Mail.Send',
            ]),
        ).toBe(true);
        expect(
            hasEmailActionScope('microsoft', 'email.send', [
                'gmail.compose',
                'gmail.readonly',
            ]),
        ).toBe(false);
    });
});
