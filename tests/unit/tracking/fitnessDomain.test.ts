import { describe, expect, it } from 'vitest';
import { computeFitnessAnalytics } from '@/features/tracking/lib/fitness/analytics';
import { normalizeWorkoutEntries } from '@/features/tracking/lib/fitness/normalize';
import {
    estimateOneRepMax,
    detectPersonalRecords,
} from '@/features/tracking/lib/fitness/progression';
import { calculateFitnessGoalProgress } from '@/features/tracking/lib/fitness/goals';
import { localExerciseLibraryProvider } from '@/features/tracking/lib/fitness/providers/exerciseLibraryProvider';
import { mapFitnessCsv } from '@/features/tracking/lib/fitness/providers/importProvider';
import { workoutFromTemplate } from '@/features/tracking/lib/fitness/providers/manualProvider';
import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { WorkoutTemplate } from '@/features/tracking/lib/fitness/types';

const entry = (overrides: Partial<TrackingEntry>): TrackingEntry => ({
    id: 'w1',
    userId: 'u1',
    category: 'workout',
    entryDate: '2026-05-18',
    loggedAt: '2026-05-18T12:00:00Z',
    metadata: {
        title: 'Push',
        workoutType: 'strength',
        durationMinutes: 45,
        exercises: [
            {
                exerciseId: 'bench',
                name: 'Bench Press',
                category: 'strength',
                muscleGroups: ['chest'],
                equipment: ['barbell'],
                sets: [
                    {
                        setType: 'working',
                        reps: 5,
                        weight: 100,
                        completed: true,
                    },
                ],
            },
        ],
    },
    tags: [],
    source: 'manual',
    createdAt: '2026-05-18T12:00:00Z',
    ...overrides,
});

describe('fitness domain', () => {
    it('normalizes workouts newest first and preserves totals', () => {
        const sessions = normalizeWorkoutEntries([
            entry({
                id: 'old',
                entryDate: '2026-05-10',
                createdAt: '2026-05-10T10:00:00Z',
            }),
            entry({
                id: 'new',
                entryDate: '2026-05-20',
                createdAt: '2026-05-20T10:00:00Z',
            }),
        ]);

        expect(sessions[0]?.id).toBe('new');
        expect(sessions[0]?.totalVolume).toBe(500);
        expect(sessions[0]?.totalSets).toBe(1);
        expect(sessions[0]?.totalReps).toBe(5);
    });

    it('calculates weekly workout count and volume', () => {
        const analytics = computeFitnessAnalytics(
            [
                entry({ id: 'a', entryDate: '2026-05-18' }),
                entry({ id: 'b', entryDate: '2026-05-19' }),
                entry({ id: 'c', entryDate: '2026-05-12' }),
            ],
            new Date('2026-05-20T12:00:00Z'),
        );

        expect(analytics.weeklyWorkoutCount).toBe(2);
        expect(analytics.weeklyVolume).toBe(1000);
        expect(analytics.previousWeeklyVolume).toBe(500);
    });

    it('detects PRs and estimates one rep max', () => {
        expect(estimateOneRepMax(100, 5)).toBe(116.7);
        const sessions = normalizeWorkoutEntries([
            entry({ id: 'a', entryDate: '2026-05-18' }),
            entry({
                id: 'b',
                entryDate: '2026-05-19',
                metadata: {
                    exercises: [
                        {
                            exerciseId: 'bench',
                            name: 'Bench Press',
                            category: 'strength',
                            muscleGroups: ['chest'],
                            equipment: ['barbell'],
                            sets: [
                                {
                                    setType: 'working',
                                    reps: 5,
                                    weight: 110,
                                    completed: true,
                                },
                            ],
                        },
                    ],
                },
            }),
        ]);

        const prs = detectPersonalRecords(sessions);
        expect(
            prs.some((pr) => pr.type === 'estimated_1rm' && pr.value === 128.3),
        ).toBe(true);
    });

    it('calculates workout goal progress', () => {
        const sessions = normalizeWorkoutEntries([
            entry({ id: 'a' }),
            entry({ id: 'b', entryDate: '2026-05-19' }),
        ]);
        const progress = calculateFitnessGoalProgress(
            {
                type: 'workouts_per_week',
                targetValue: 4,
                unit: 'workouts',
                period: 'week',
            },
            sessions,
        );

        expect(progress.value).toBe(2);
        expect(progress.ratio).toBe(0.5);
    });

    it('searches local exercise fallback by aliases and muscles', async () => {
        const results = await localExerciseLibraryProvider.search({
            query: 'bench',
            muscleGroup: 'chest',
        });

        expect(results[0]?.name).toBe('Barbell Bench Press');
    });

    it('maps CSV imports and detects duplicate rows', () => {
        const preview = mapFitnessCsv(
            'date,workout name,exercise name,set number,reps,weight\n2026-05-18,Push,Bench Press,1,5,100\n2026-05-18,Push,Bench Press,1,5,100',
        );

        expect(preview.ready).toBe(1);
        expect(preview.duplicates).toBe(1);
        expect(preview.rows[0]?.session?.totalVolume).toBe(500);
    });

    it('converts routines to workout sessions', () => {
        const template: WorkoutTemplate = {
            id: 't1',
            name: 'Push Routine',
            workoutType: 'strength',
            exercises: [
                {
                    exerciseId: 'bench',
                    name: 'Bench Press',
                    targetSets: [{ setType: 'working', reps: 5, weight: 100 }],
                },
            ],
            tags: [],
            createdAt: '2026-05-18T12:00:00Z',
        };

        const workout = workoutFromTemplate(template, '2026-05-20');

        expect(workout.title).toBe('Push Routine');
        expect(workout.exercises[0]?.sets[0]?.completed).toBe(false);
    });

    it('handles empty and partial data states', () => {
        const analytics = computeFitnessAnalytics([]);
        const partial = normalizeWorkoutEntries([
            entry({ metadata: { workoutType: 'cardio', duration: 30 } }),
        ]);

        expect(analytics.insights[0]).toBe('Not enough data for insights yet.');
        expect(partial[0]?.durationMinutes).toBe(30);
        expect(partial[0]?.totalVolume).toBe(0);
    });
});
