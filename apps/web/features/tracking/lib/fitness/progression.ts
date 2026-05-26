import type { PersonalRecord, SetEntry, WorkoutSession } from './types';

export function estimateOneRepMax(weight: number, reps: number): number {
    if (weight <= 0 || reps <= 0) return 0;
    if (reps === 1) return Math.round(weight * 10) / 10;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function setVolume(set: SetEntry): number {
    return (set.reps ?? 0) * (set.weight ?? set.resistance ?? 0);
}

export function detectPersonalRecords(
    sessions: WorkoutSession[],
): PersonalRecord[] {
    const chronological = [...sessions].sort((a, b) =>
        a.date.localeCompare(b.date),
    );
    const bests = new Map<string, number>();
    const prs: PersonalRecord[] = [];

    for (const session of chronological) {
        for (const exercise of session.exercises) {
            for (const set of exercise.sets) {
                if (!set.completed) continue;
                const candidates: Array<{
                    type: PersonalRecord['type'];
                    value: number;
                    unit: string;
                }> = [];
                const reps = set.reps ?? 0;
                const weight = set.weight ?? set.resistance ?? 0;
                if (weight > 0)
                    candidates.push({
                        type: 'max_weight',
                        value: weight,
                        unit: 'lb',
                    });
                if (reps > 0)
                    candidates.push({
                        type: 'max_reps',
                        value: reps,
                        unit: 'reps',
                    });
                if (weight > 0 && reps > 0) {
                    candidates.push({
                        type: 'estimated_1rm',
                        value: estimateOneRepMax(weight, reps),
                        unit: 'lb',
                    });
                    candidates.push({
                        type: 'best_volume_set',
                        value: setVolume(set),
                        unit: 'lb',
                    });
                }
                if ((set.durationSeconds ?? 0) > 0) {
                    candidates.push({
                        type: 'longest_duration',
                        value: set.durationSeconds ?? 0,
                        unit: 'sec',
                    });
                }
                if ((set.distance ?? 0) > 0) {
                    candidates.push({
                        type: 'longest_distance',
                        value: set.distance ?? 0,
                        unit: 'mi',
                    });
                }

                for (const candidate of candidates) {
                    if (
                        !Number.isFinite(candidate.value) ||
                        candidate.value <= 0
                    )
                        continue;
                    const key = `${exercise.exerciseId}:${candidate.type}`;
                    const previous = bests.get(key);
                    if (previous === undefined || candidate.value > previous) {
                        bests.set(key, candidate.value);
                        prs.push({
                            id: `${session.id}-${exercise.exerciseId}-${candidate.type}-${candidate.value}`,
                            exerciseId: exercise.exerciseId,
                            exerciseName: exercise.name,
                            type: candidate.type,
                            value: candidate.value,
                            unit: candidate.unit,
                            date: session.date,
                            workoutId: session.id,
                            ...(previous !== undefined && {
                                previousValue: previous,
                            }),
                        });
                    }
                }
            }
        }
    }

    return prs.sort((a, b) => b.date.localeCompare(a.date));
}

export function volumeByExercise(
    sessions: WorkoutSession[],
): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const session of sessions) {
        for (const exercise of session.exercises) {
            totals[exercise.name] =
                (totals[exercise.name] ?? 0) +
                exercise.sets.reduce(
                    (sum, set) => sum + (set.completed ? setVolume(set) : 0),
                    0,
                );
        }
    }
    return totals;
}

export function convertTemplateToWorkoutDate(date: string): {
    date: string;
    startTime: string;
} {
    return { date, startTime: `${date}T12:00:00` };
}
