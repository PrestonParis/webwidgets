import { describe, expect, it } from 'vitest';
import { buildTrackingAutomationRules } from '@/features/tracking/lib/trackingAutomations';
import {
    generateTrackingPredictions,
    predictRecoveryNeed,
    predictTrackingConsistency,
} from '@/features/tracking/lib/trackingPredictions';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

const entry = (overrides: Partial<TrackingEntry>): TrackingEntry => ({
    id: 'e1',
    userId: 'u1',
    category: 'mood',
    entryDate: '2026-05-18',
    loggedAt: '2026-05-18T12:00:00Z',
    metadata: { score: 3 },
    tags: [],
    source: 'manual',
    createdAt: '2026-05-18T12:00:00Z',
    ...overrides,
});

describe('tracking predictions', () => {
    describe('consistency', () => {
        it('flags missing weekly logs as a consistency risk', () => {
            const prediction = predictTrackingConsistency([], 'sleep');

            expect(prediction.label).toBe('Sleep streak at risk');
            expect(prediction.suggestedActionId).toBe('tracking.log_entry');
        });
    });

    describe('recovery', () => {
        it('detects recovery need from high strain and low sleep', () => {
            const prediction = predictRecoveryNeed([
                entry({
                    id: 'w1',
                    category: 'workout',
                    entryDate: '2026-05-15',
                    metadata: { intensity: 5 },
                }),
                entry({
                    id: 'w2',
                    category: 'workout',
                    entryDate: '2026-05-16',
                    metadata: { intensity: 4 },
                }),
                entry({
                    id: 'w3',
                    category: 'workout',
                    entryDate: '2026-05-17',
                    metadata: { intensity: 5 },
                }),
                entry({
                    id: 's1',
                    category: 'sleep',
                    entryDate: '2026-05-15',
                    metadata: { quality: 2 },
                }),
                entry({
                    id: 's2',
                    category: 'sleep',
                    entryDate: '2026-05-16',
                    metadata: { quality: 2 },
                }),
                entry({
                    id: 's3',
                    category: 'sleep',
                    entryDate: '2026-05-17',
                    metadata: { quality: 3 },
                }),
            ]);

            expect(prediction?.label).toBe('Recovery day candidate');
        });
    });

    describe('automation', () => {
        it('generates automation rules from tracking category configs', () => {
            const rules = buildTrackingAutomationRules([
                entry({
                    id: 'm1',
                    category: 'mood',
                    entryDate: '2026-05-16',
                    metadata: { score: 4 },
                }),
                entry({
                    id: 'm2',
                    category: 'mood',
                    entryDate: '2026-05-17',
                    metadata: { score: 3 },
                }),
                entry({
                    id: 'm3',
                    category: 'mood',
                    entryDate: '2026-05-18',
                    metadata: { score: 4 },
                }),
            ]);

            expect(rules.some((rule) => rule.id === 'mood-threshold')).toBe(
                true,
            );
            expect(rules.some((rule) => rule.type === 'missing_log')).toBe(
                true,
            );
        });
    });

    describe('generation', () => {
        it('returns bounded deterministic predictions', () => {
            const predictions = generateTrackingPredictions([
                entry({
                    id: 'a',
                    category: 'mood',
                    entryDate: '2026-05-15',
                    metadata: { score: 2, energy: 2 },
                }),
                entry({
                    id: 'b',
                    category: 'mood',
                    entryDate: '2026-05-16',
                    metadata: { score: 3, energy: 2 },
                }),
                entry({
                    id: 'c',
                    category: 'mood',
                    entryDate: '2026-05-17',
                    metadata: { score: 4, energy: 3 },
                }),
                entry({
                    id: 'd',
                    category: 'mood',
                    entryDate: '2026-05-18',
                    metadata: { score: 5, energy: 4 },
                }),
            ]);

            expect(predictions.length).toBeGreaterThan(0);
            expect(
                predictions.every(
                    (prediction) => prediction.confidence <= 0.95,
                ),
            ).toBe(true);
        });
    });
});
