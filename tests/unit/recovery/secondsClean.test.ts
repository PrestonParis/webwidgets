import { describe, it, expect } from 'vitest';
import { calcSecondsClean } from '@/features/recovery/lib/secondsClean';

const START = '2026-05-16T00:00:00Z';
const startMs = new Date(START).getTime();

describe('calcSecondsClean', () => {
    it('returns 0 when now equals start', () => {
        expect(calcSecondsClean(startMs, START)).toBe(0);
    });

    it('returns 60 after one minute', () => {
        expect(calcSecondsClean(startMs + 60_000, START)).toBe(60);
    });

    it('returns 86400 after one day', () => {
        expect(calcSecondsClean(startMs + 86_400_000, START)).toBe(86_400);
    });

    it('floors partial seconds', () => {
        expect(calcSecondsClean(startMs + 1_500, START)).toBe(1);
    });

    it('clamps to 0 for past start times', () => {
        expect(calcSecondsClean(startMs - 5_000, START)).toBe(0);
    });

    it('handles very large elapsed times', () => {
        const oneYear = 365 * 86_400_000;
        expect(calcSecondsClean(startMs + oneYear, START)).toBe(365 * 86_400);
    });
});
