import { describe, expect, it } from 'vitest';
import { computeSupplementAnalytics } from '@/features/tracking/lib/supplements/analytics';
import {
    decrementInventory,
    normalizeSupplementDefinitions,
    normalizeSupplementLogs,
} from '@/features/tracking/lib/supplements/normalize';
import {
    calculateDueDoses,
    calculateNextDose,
} from '@/features/tracking/lib/supplements/schedule';
import {
    defaultAllergyProfile,
    detectSupplementWarnings,
} from '@/features/tracking/lib/supplements/safety';
import { mapSupplementCsv } from '@/features/tracking/lib/supplements/importExport';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { Supplement } from '@/features/tracking/types/supplement';

const supplement: Supplement = {
    id: 's1',
    userId: 'u1',
    name: 'Magnesium',
    dose: '200 mg',
    scheduleType: 'by_time',
    scheduleStart: '08:00',
    active: true,
    createdAt: '2026-05-18T12:00:00Z',
};

const entry = (overrides: Partial<TrackingEntry>): TrackingEntry => ({
    id: 'e1',
    userId: 'u1',
    category: 'supplement',
    entryDate: '2026-05-18',
    loggedAt: '2026-05-18T08:00:00Z',
    metadata: {
        name: 'Magnesium',
        status: 'taken',
        taken: true,
        time: '08:00',
    },
    tags: [],
    source: 'manual',
    createdAt: '2026-05-18T08:00:00Z',
    ...overrides,
});

describe('supplements domain', () => {
    describe('normalization', () => {
        it('normalizes logs newest first and preserves taken/skipped/missed state', () => {
            const logs = normalizeSupplementLogs([
                entry({
                    id: 'old',
                    entryDate: '2026-05-17',
                    metadata: {
                        name: 'Magnesium',
                        status: 'skipped',
                        skipReason: 'travel',
                    },
                }),
                entry({
                    id: 'new',
                    entryDate: '2026-05-18',
                    metadata: { name: 'Magnesium', status: 'missed' },
                }),
            ]);

            expect(logs[0]?.id).toBe('new');
            expect(logs[0]?.status).toBe('missed');
            expect(logs[1]?.skipReason).toBe('travel');
        });
    });

    describe('scheduling', () => {
        it('calculates due doses and next dose timezone-safe by local date/time', () => {
            const definitions = normalizeSupplementDefinitions(
                [supplement],
                [],
            );
            const due = calculateDueDoses(
                definitions,
                [],
                new Date('2026-05-18T09:00:00'),
            );
            const next = calculateNextDose(
                definitions,
                [],
                new Date('2026-05-18T09:00:00'),
            );

            expect(due[0]?.status).toBe('missed');
            expect(due[0]?.overdue).toBe(true);
            expect(next?.date).toBe('2026-05-19');
        });
    });

    describe('analytics', () => {
        it('calculates adherence and skipped reason breakdown', () => {
            const analytics = computeSupplementAnalytics(
                [supplement],
                [
                    entry({
                        id: 'a',
                        entryDate: '2026-05-18',
                        metadata: {
                            name: 'Magnesium',
                            status: 'taken',
                            taken: true,
                        },
                    }),
                    entry({
                        id: 'b',
                        entryDate: '2026-05-17',
                        metadata: {
                            name: 'Magnesium',
                            status: 'skipped',
                            skipReason: 'nausea',
                        },
                    }),
                ],
                new Date('2026-05-18T12:00:00'),
            );

            expect(analytics.adherence7d).toBe(0.5);
            expect(analytics.skippedReasonBreakdown['nausea']).toBe(1);
        });

        it('tracks side effects, effectiveness trend, and adherence/effectiveness correlation', () => {
            const analytics = computeSupplementAnalytics(
                [],
                [
                    entry({
                        id: 'a',
                        metadata: {
                            name: 'Magnesium',
                            status: 'taken',
                            perceivedEffectiveness: 8,
                            outcomeRating: 7,
                            sideEffects: [{ name: 'nausea', severity: 3 }],
                        },
                    }),
                    entry({
                        id: 'b',
                        entryDate: '2026-05-17',
                        metadata: {
                            name: 'Magnesium',
                            status: 'skipped',
                            perceivedEffectiveness: 4,
                            outcomeRating: 4,
                        },
                    }),
                    entry({
                        id: 'c',
                        entryDate: '2026-05-16',
                        metadata: {
                            name: 'Magnesium',
                            status: 'taken',
                            perceivedEffectiveness: 7,
                            outcomeRating: 7,
                        },
                    }),
                ],
                new Date('2026-05-18T12:00:00'),
            );

            expect(analytics.sideEffectFrequency['nausea']).toBe(1);
            expect(analytics.effectivenessTrend).toEqual([8, 4, 7]);
            expect(analytics.adherenceEffectivenessCorrelation).not.toBeNull();
        });

        it('decrements inventory and flags low stock and expiration', () => {
            const definitions = normalizeSupplementDefinitions(
                [],
                [
                    entry({
                        metadata: {
                            name: 'Vitamin D',
                            quantityRemaining: 5,
                            dosesRemaining: 5,
                            reorderThreshold: 7,
                            expirationDate: '2026-05-25',
                            cost: 10,
                        },
                    }),
                ],
            );
            const decremented = decrementInventory(definitions[0]!);
            const analytics = computeSupplementAnalytics(
                [],
                [
                    entry({
                        metadata: {
                            name: 'Vitamin D',
                            quantityRemaining: 5,
                            dosesRemaining: 5,
                            reorderThreshold: 7,
                            expirationDate: '2026-05-25',
                        },
                    }),
                ],
                new Date('2026-05-18T12:00:00'),
            );

            expect(decremented?.dosesRemaining).toBe(4);
            expect(analytics.lowInventory.length).toBe(1);
            expect(analytics.expiringSoon.length).toBe(1);
        });
    });

    describe('safety', () => {
        it('detects allergy, blocked ingredient, dietary flag, and stimulant warnings', () => {
            const definitions = normalizeSupplementDefinitions(
                [],
                [
                    entry({
                        metadata: {
                            name: 'Energy Caps',
                            activeIngredients: 'caffeine',
                            inactiveIngredients: 'gelatin, peanut oil',
                            vegan: false,
                        },
                    }),
                ],
            );
            const warnings = detectSupplementWarnings(definitions[0]!, {
                ...defaultAllergyProfile(),
                allergens: ['peanut'],
                blockedIngredients: ['caffeine'],
                dietaryFlags: { vegan: true },
            });

            expect(
                warnings.some(
                    (warning) => warning.label === 'Allergen warning',
                ),
            ).toBe(true);
            expect(
                warnings.some((warning) => warning.severity === 'blocked'),
            ).toBe(true);
            expect(
                warnings.some(
                    (warning) => warning.label === 'Vegan source check',
                ),
            ).toBe(true);
            expect(
                warnings.some((warning) => warning.label === 'Stimulant check'),
            ).toBe(true);
        });
    });

    describe('import', () => {
        it('maps CSV imports, detects duplicates, and supports empty states', () => {
            const preview = mapSupplementCsv(
                'date,time,name,status\n2026-05-18,08:00,Magnesium,taken\n2026-05-18,08:00,Magnesium,taken',
            );
            const analytics = computeSupplementAnalytics([], []);

            expect(preview.ready).toBe(1);
            expect(preview.duplicates).toBe(1);
            expect(analytics.insights[0]).toBe('No supplement logs yet.');
        });
    });
});
