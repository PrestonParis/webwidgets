import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getStreak } from '@/features/habit/lib/habitUtils';
import type { HabitCompletion } from '@/features/habit/types/habit';

const FIXED_NOW = new Date('2026-05-13T12:00:00Z');
const HABIT_ID = 'habit-1';

function completion(date: string): HabitCompletion {
    return {
        id: crypto.randomUUID(),
        habit_id: HABIT_ID,
        completed_date: date,
    };
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
});
afterEach(() => vi.useRealTimers());

describe('getStreak', () => {
    it('returns 0 for no completions', () => {
        expect(getStreak(HABIT_ID, [])).toBe(0);
    });

    it('returns 0 when the most recent completion is more than a day old', () => {
        expect(getStreak(HABIT_ID, [completion('2026-05-11')])).toBe(0);
    });

    it('returns 1 when completed only today', () => {
        expect(getStreak(HABIT_ID, [completion('2026-05-13')])).toBe(1);
    });

    it('returns 1 when completed only yesterday', () => {
        expect(getStreak(HABIT_ID, [completion('2026-05-12')])).toBe(1);
    });

    it('counts a consecutive streak ending today', () => {
        const completions = [
            completion('2026-05-13'),
            completion('2026-05-12'),
            completion('2026-05-11'),
        ];
        expect(getStreak(HABIT_ID, completions)).toBe(3);
    });

    it('stops the streak at a gap', () => {
        const completions = [
            completion('2026-05-13'),
            completion('2026-05-12'),
            // gap: May 11 missing
            completion('2026-05-10'),
        ];
        expect(getStreak(HABIT_ID, completions)).toBe(2);
    });

    it('ignores completions for other habits', () => {
        const completions = [
            { id: '1', habit_id: 'other-habit', completed_date: '2026-05-13' },
            completion('2026-05-13'),
            completion('2026-05-12'),
        ];
        expect(getStreak(HABIT_ID, completions)).toBe(2);
    });

    it('handles unordered completions', () => {
        const completions = [
            completion('2026-05-11'),
            completion('2026-05-13'),
            completion('2026-05-12'),
        ];
        expect(getStreak(HABIT_ID, completions)).toBe(3);
    });
});
