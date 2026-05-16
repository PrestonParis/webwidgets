import { describe, it, expect } from 'vitest';
import { getDayStatus } from '@/features/recovery/lib/calendarUtils';

const TODAY = new Date('2026-05-13T00:00:00');
const CREATED_AT = '2026-05-01T00:00:00Z';

describe('getDayStatus', () => {
    it('returns "future" for days after today', () => {
        expect(getDayStatus(14, 2026, 4, TODAY, CREATED_AT, [])).toBe('future');
    });

    it('returns "before" for days before the tracker was created', () => {
        // April 30 is before May 1 createdAt
        expect(getDayStatus(30, 2026, 3, TODAY, CREATED_AT, [])).toBe('before');
    });

    it('returns "relapse" for days in the relapse list', () => {
        expect(
            getDayStatus(7, 2026, 4, TODAY, CREATED_AT, ['2026-05-07']),
        ).toBe('relapse');
    });

    it('returns "clean" for a past day with no relapse', () => {
        expect(getDayStatus(5, 2026, 4, TODAY, CREATED_AT, [])).toBe('clean');
    });

    it('returns "clean" for today when not in relapses', () => {
        expect(getDayStatus(13, 2026, 4, TODAY, CREATED_AT, [])).toBe('clean');
    });

    it('returns "relapse" for today when today is in the relapse list', () => {
        expect(
            getDayStatus(13, 2026, 4, TODAY, CREATED_AT, ['2026-05-13']),
        ).toBe('relapse');
    });

    it('returns "clean" for the creation day itself', () => {
        expect(getDayStatus(1, 2026, 4, TODAY, CREATED_AT, [])).toBe('clean');
    });
});
