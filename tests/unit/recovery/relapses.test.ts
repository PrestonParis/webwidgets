import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// supabase.ts initializes a client at module load; mock it so the test
// environment doesn't require real env vars.
vi.mock('@/lib/db/supabase', () => ({ supabase: {} }));

import {
    toDateKey,
    computeLongestStreakDays,
} from '@/features/recovery/lib/relapses';

const FIXED_NOW = new Date('2026-05-13T12:00:00Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
});
afterEach(() => vi.useRealTimers());

describe('toDateKey', () => {
    it('extracts the date portion of a UTC timestamp', () => {
        expect(toDateKey(new Date('2026-05-13T00:00:00Z'))).toBe('2026-05-13');
    });

    it('works for the first day of a year', () => {
        expect(toDateKey(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
    });
});

describe('computeLongestStreakDays', () => {
    it('returns full span when there are no relapses', () => {
        // createdAt = May 1, today = May 13 → 12 days
        expect(computeLongestStreakDays('2026-05-01T00:00:00Z', [])).toBe(12);
    });

    it('returns 0 when created today and no relapses', () => {
        expect(computeLongestStreakDays('2026-05-13T00:00:00Z', [])).toBe(0);
    });

    it('splits the streak at each relapse and returns the longest segment', () => {
        // May 1 → May 7 = 6 days, May 7 → May 13 = 6 days
        expect(
            computeLongestStreakDays('2026-05-01T00:00:00Z', ['2026-05-07']),
        ).toBe(6);
    });

    it('picks the longer segment when two splits are uneven', () => {
        // May 1 → May 4 = 3, May 4 → May 10 = 6, May 10 → May 13 = 3
        expect(
            computeLongestStreakDays('2026-05-01T00:00:00Z', [
                '2026-05-04',
                '2026-05-10',
            ]),
        ).toBe(6);
    });

    it('deduplicates relapse dates', () => {
        const result = computeLongestStreakDays('2026-05-01T00:00:00Z', [
            '2026-05-07',
            '2026-05-07',
        ]);
        expect(result).toBe(6);
    });

    it('returns 0 when there are no days in any segment', () => {
        expect(computeLongestStreakDays('2026-05-13T00:00:00Z', [])).toBe(0);
    });
});
