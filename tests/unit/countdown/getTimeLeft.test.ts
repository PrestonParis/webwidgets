import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTimeLeft } from '@/features/countdown/lib/utils';

const FIXED_NOW = new Date('2026-05-13T00:00:00Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
});
afterEach(() => vi.useRealTimers());

describe('getTimeLeft', () => {
    it('returns null for a past date', () => {
        expect(getTimeLeft('2026-05-12T00:00:00Z')).toBeNull();
    });

    it('returns null for the exact current moment', () => {
        expect(getTimeLeft('2026-05-13T00:00:00Z')).toBeNull();
    });

    it('returns exactly 1 day for a target 24 hours away', () => {
        expect(getTimeLeft('2026-05-14T00:00:00Z')).toEqual({
            days: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });
    });

    it('returns correct hours, minutes, seconds for a sub-day target', () => {
        expect(getTimeLeft('2026-05-13T01:30:45Z')).toEqual({
            days: 0,
            hours: 1,
            minutes: 30,
            seconds: 45,
        });
    });

    it('returns multi-day breakdown correctly', () => {
        // 2 days + 3 hours + 0 minutes + 0 seconds
        expect(getTimeLeft('2026-05-15T03:00:00Z')).toEqual({
            days: 2,
            hours: 3,
            minutes: 0,
            seconds: 0,
        });
    });
});
