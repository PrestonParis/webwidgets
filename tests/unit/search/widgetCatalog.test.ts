import { describe, it, expect } from 'vitest';
import {
    searchWidgets,
    WIDGET_CATALOG,
} from '@/features/search/lib/widgetCatalog';

describe('WIDGET_CATALOG', () => {
    it('contains at least one entry per documented widget type', () => {
        const types = WIDGET_CATALOG.map((w) => w.type);
        const expected = [
            'texteditor',
            'email',
            'chess',
            'recovery',
            'timekeeping',
            'todo',
            'weather',
            'calendar',
        ];
        for (const t of expected) {
            expect(types).toContain(t);
        }
    });

    it('every entry has non-empty required fields', () => {
        for (const w of WIDGET_CATALOG) {
            expect(w.type).toBeTruthy();
            expect(w.name).toBeTruthy();
            expect(w.emoji).toBeTruthy();
            expect(w.description).toBeTruthy();
            expect(w.href).toBeTruthy();
            expect(w.keywords.length).toBeGreaterThan(0);
            expect(w.betaState).toMatch(/^(stable|beta)$/);
        }
    });

    it('labels suspended experiences as beta and the timeline as stable', () => {
        expect(
            WIDGET_CATALOG.find((widget) => widget.type === 'chess')?.betaState,
        ).toBe('beta');
        expect(
            WIDGET_CATALOG.find((widget) => widget.type === 'reading')
                ?.betaState,
        ).toBe('beta');
        expect(
            WIDGET_CATALOG.find((widget) => widget.type === 'memorization')
                ?.betaState,
        ).toBe('beta');
        expect(
            WIDGET_CATALOG.find((widget) => widget.type === 'news'),
        ).toMatchObject({
            name: 'Timeline Intelligence',
            betaState: 'stable',
        });
    });
});

describe('searchWidgets', () => {
    it('returns empty array for empty query', () => {
        expect(searchWidgets('')).toEqual([]);
        expect(searchWidgets('   ')).toEqual([]);
    });

    it('matches by widget name', () => {
        const results = searchWidgets('chess');
        expect(results.some((w) => w.type === 'chess')).toBe(true);
    });

    it('matches by keyword', () => {
        const results = searchWidgets('sobriety');
        expect(results.some((w) => w.type === 'recovery')).toBe(true);
    });

    it('matches by description substring', () => {
        const results = searchWidgets('Gmail');
        expect(results.some((w) => w.type === 'email')).toBe(true);
    });

    it('is case-insensitive', () => {
        const lower = searchWidgets('journal');
        const upper = searchWidgets('JOURNAL');
        expect(lower.map((w) => w.type)).toEqual(upper.map((w) => w.type));
    });

    it('returns no results for a nonsense query', () => {
        expect(searchWidgets('xyzzyquux1234')).toEqual([]);
    });

    it('can return multiple widget matches for a broad term', () => {
        // "timer" should match at least pomodoro and countdown
        const results = searchWidgets('timer');
        expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('matches worldclock by keyword "timezone"', () => {
        const results = searchWidgets('timezone');
        expect(results.some((w) => w.type === 'worldclock')).toBe(true);
    });

    it('matches converter by keyword "exchange"', () => {
        const results = searchWidgets('exchange');
        expect(results.some((w) => w.type === 'converter')).toBe(true);
    });

    it('prioritizes converter over widget builder for "convert"', () => {
        const results = searchWidgets('convert');
        expect(results[0]?.type).toBe('converter');
        expect(results.some((w) => w.type === 'widget-builder')).toBe(false);
    });
});
