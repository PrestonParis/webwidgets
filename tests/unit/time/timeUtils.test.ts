import { describe, it, expect } from 'vitest';
import {
    formatTime,
    getTimeParts,
    snapMinute,
    getMonthMeta,
    to24Hour,
} from '@/lib/utils/time';

describe('formatTime', () => {
    it('formats zero seconds', () => {
        expect(formatTime(0)).toBe('0d 0h 0m 0s');
    });

    it('formats exactly one day', () => {
        expect(formatTime(86400)).toBe('1d 0h 0m 0s');
    });

    it('formats mixed components', () => {
        expect(formatTime(90061)).toBe('1d 1h 1m 1s');
    });

    it('formats seconds only', () => {
        expect(formatTime(59)).toBe('0d 0h 0m 59s');
    });

    it('formats hours and minutes without days', () => {
        expect(formatTime(3660)).toBe('0d 1h 1m 0s');
    });
});

describe('getTimeParts', () => {
    it('returns all zeros for zero input', () => {
        expect(getTimeParts(0)).toEqual({
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });
    });

    it('returns correct parts for one year', () => {
        const { years } = getTimeParts(31557600);
        expect(years).toBe(1);
    });

    it('returns correct hours and minutes for sub-day input', () => {
        const { years, months, days, hours, minutes, seconds } =
            getTimeParts(3661);
        expect(years).toBe(0);
        expect(months).toBe(0);
        expect(days).toBe(0);
        expect(hours).toBe(1);
        expect(minutes).toBe(1);
        expect(seconds).toBe(1);
    });

    it('returns one day for 86400 seconds', () => {
        const { days } = getTimeParts(86400);
        expect(days).toBe(1);
    });
});

describe('snapMinute', () => {
    it('snaps 0 to 0', () => expect(snapMinute(0)).toBe(0));
    it('snaps 3 up to 5', () => expect(snapMinute(3)).toBe(5));
    it('snaps 7 down to 5', () => expect(snapMinute(7)).toBe(5));
    it('snaps 8 up to 10', () => expect(snapMinute(8)).toBe(10));
    it('keeps 30 at 30', () => expect(snapMinute(30)).toBe(30));
    it('snaps 57 down to 55', () => expect(snapMinute(57)).toBe(55));
    it('snaps 58 up to 60', () => expect(snapMinute(58)).toBe(60));
});

describe('getMonthMeta', () => {
    it('returns 31 days for January', () => {
        expect(getMonthMeta(2026, 0).daysInMonth).toBe(31);
    });

    it('returns 28 days for February in a non-leap year', () => {
        expect(getMonthMeta(2026, 1).daysInMonth).toBe(28);
    });

    it('returns 29 days for February in a leap year', () => {
        expect(getMonthMeta(2024, 1).daysInMonth).toBe(29);
    });

    it('returns correct firstDay for a known month', () => {
        // May 2026: May 1 is a Friday (day 5)
        expect(getMonthMeta(2026, 4).firstDay).toBe(5);
    });

    it('returns firstDay in range 0–6', () => {
        const { firstDay } = getMonthMeta(2026, 3);
        expect(firstDay).toBeGreaterThanOrEqual(0);
        expect(firstDay).toBeLessThanOrEqual(6);
    });
});

describe('to24Hour', () => {
    it('converts 12 PM to 12 (noon)', () =>
        expect(to24Hour(12, 'PM')).toBe(12));
    it('converts 1 PM to 13', () => expect(to24Hour(1, 'PM')).toBe(13));
    it('converts 11 PM to 23', () => expect(to24Hour(11, 'PM')).toBe(23));
    it('converts 12 AM to 0 (midnight)', () =>
        expect(to24Hour(12, 'AM')).toBe(0));
    it('converts 1 AM to 1', () => expect(to24Hour(1, 'AM')).toBe(1));
    it('converts 11 AM to 11', () => expect(to24Hour(11, 'AM')).toBe(11));
});
