import { describe, it, expect } from 'vitest';
import { buildEmailResponse } from '@/features/inbox/lib/buildResponse';

describe('buildEmailResponse', () => {
    it('returns an empty array when parsed is empty', () => {
        expect(buildEmailResponse([], new Map())).toEqual([]);
    });

    it('merges category and is_manual from the categoryMap', () => {
        const parsed = [{ id: 'e1', subject: 'Hello' }];
        const map = new Map([['e1', { category: 'work', is_manual: true }]]);
        const result = buildEmailResponse(parsed, map);
        expect(result).toEqual([
            { id: 'e1', subject: 'Hello', category: 'work', is_manual: true },
        ]);
    });

    it('falls back to "other" and false when email is not in the map', () => {
        const parsed = [{ id: 'e2', subject: 'Unknown' }];
        const result = buildEmailResponse(parsed, new Map());
        expect(result[0]?.category).toBe('other');
        expect(result[0]?.is_manual).toBe(false);
    });

    it('handles a mix of matched and unmatched emails', () => {
        const parsed = [
            { id: 'e1', subject: 'Invoice' },
            { id: 'e2', subject: 'Newsletter' },
        ];
        const map = new Map([
            ['e1', { category: 'finance', is_manual: false }],
        ]);
        const result = buildEmailResponse(parsed, map);
        expect(result[0]?.category).toBe('finance');
        expect(result[1]?.category).toBe('other');
    });

    it('preserves all original fields from the parsed email', () => {
        const parsed = [
            {
                id: 'e1',
                subject: 'Test',
                sender: 'a@b.com',
                date: '2026-01-01',
            },
        ];
        const result = buildEmailResponse(parsed, new Map());
        expect(result[0]).toMatchObject({
            id: 'e1',
            subject: 'Test',
            sender: 'a@b.com',
        });
    });
});
