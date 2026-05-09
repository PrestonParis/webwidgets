import { describe, it, expect } from 'vitest';
import { classifyWithRules } from '@/features/inbox/lib/rules';
import type { EmailInput } from '@/features/inbox/types/inbox';

function make(idx: number, sender: string, subject: string): EmailInput {
    return { idx, sender, subject };
}

describe('classifyWithRules', () => {
    it('categorizes GitHub notifications as work', () => {
        const result = classifyWithRules([
            make(0, 'notifications@github.com', 'PR review requested'),
        ]);
        expect(result.get(0)).toBe('work');
    });

    it('categorizes invoice emails as finance', () => {
        const result = classifyWithRules([
            make(0, 'billing@stripe.com', 'Your invoice is ready'),
        ]);
        expect(result.get(0)).toBe('finance');
    });

    it('categorizes Amazon shipment emails as shopping', () => {
        const result = classifyWithRules([
            make(
                0,
                'ship-confirm@amazon.com',
                'Your package has been delivered',
            ),
        ]);
        expect(result.get(0)).toBe('shopping');
    });

    it('categorizes newsletter emails as promotions', () => {
        const result = classifyWithRules([
            make(0, 'hello@substack.com', 'Weekly digest — issue #42'),
        ]);
        expect(result.get(0)).toBe('promotions');
    });

    it('categorizes social notification emails as social', () => {
        const result = classifyWithRules([
            make(0, 'notification@twitter.com', 'Someone liked your tweet'),
        ]);
        expect(result.get(0)).toBe('social');
    });

    it('returns other for unrecognized emails', () => {
        const result = classifyWithRules([
            make(0, 'unknown@example.com', 'Hello there'),
        ]);
        expect(result.get(0)).toBe('other');
    });

    it('handles a batch of mixed emails', () => {
        const emails = [
            make(0, 'noreply@github.com', 'New issue opened'),
            make(1, 'sales@randomstore.com', '50% off sale ends tonight'),
            make(2, 'mom@gmail.com', 'Thanksgiving plans'),
        ];
        const result = classifyWithRules(emails);
        expect(result.get(0)).toBe('work');
        expect(result.get(1)).toBe('promotions');
        expect(result.get(2)).toBe('other');
    });

    it('matches case-insensitively', () => {
        const result = classifyWithRules([
            make(0, 'BILLING@PAYPAL.COM', 'PAYMENT RECEIPT'),
        ]);
        expect(result.get(0)).toBe('finance');
    });

    it('categorizes Zoom meeting emails as work', () => {
        const result = classifyWithRules([
            make(0, 'no-reply@zoom.us', 'Your Zoom meeting is starting'),
        ]);
        expect(result.get(0)).toBe('work');
    });

    it('categorizes bank statement emails as finance', () => {
        const result = classifyWithRules([
            make(0, 'alerts@chase.com', 'Your monthly statement is ready'),
        ]);
        expect(result.get(0)).toBe('finance');
    });

    it('returns a Map with one entry per email', () => {
        const emails = [make(0, 'a@b.com', 'hi'), make(5, 'c@d.com', 'bye')];
        const result = classifyWithRules(emails);
        expect(result.size).toBe(2);
        expect(result.has(0)).toBe(true);
        expect(result.has(5)).toBe(true);
    });

    it('returns empty map for empty input', () => {
        const result = classifyWithRules([]);
        expect(result.size).toBe(0);
    });
});
