import type { PersonalRecord, SetEntry, WorkoutSession } from './types';

export function estimateOneRepMax(weight: number, reps: number): number {
    if (weight <= 0 || reps <= 0) return 0;
    if (reps === 1) return Math.round(weight * 10) / 10;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function setVolume(set: SetEntry): number {
    return (set.reps ?? 0) * (set.weight ?? set.resistance ?? 0);
}

function buildCandidates(set: SetEntry): Array<{
    type: PersonalRecord['type'];
    value: number;
    unit: string;
}> {
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
    return candidates;
}

function processCandidate(
    candidate: { type: PersonalRecord['type']; value: number; unit: string },
    exerciseId: string,
    exerciseName: string,
    session: WorkoutSession,
    bests: Map<string, number>,
): PersonalRecord | null {
    if (!Number.isFinite(candidate.value) || candidate.value <= 0) {
        return null;
    }
    const key = `${exerciseId}:${candidate.type}`;
    const previous = bests.get(key);
    if (previous === undefined || candidate.value > previous) {
        bests.set(key, candidate.value);
        return {
            id: `${session.id}-${exerciseId}-${candidate.type}-${candidate.value}`,
            exerciseId,
            exerciseName,
            type: candidate.type,
            value: candidate.value,
            unit: candidate.unit,
            date: session.date,
            workoutId: session.id,
            ...(previous !== undefined && {
                previousValue: previous,
            }),
        };
    }
    return null;
}

function collectSessionPersonalRecords(
    session: WorkoutSession,
    bests: Map<string, number>,
): PersonalRecord[] {
    const records: PersonalRecord[] = [];
    for (const exercise of session.exercises) {
        const completedSets = exercise.sets.filter((set) => set.completed);
        for (const set of completedSets) {
            const candidates = buildCandidates(set);
            for (const candidate of candidates) {
                const pr = processCandidate(
                    candidate,
                    exercise.exerciseId,
                    exercise.name,
                    session,
                    bests,
                );
                if (pr) records.push(pr);
            }
        }
    }
    return records;
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
        prs.push(...collectSessionPersonalRecords(session, bests));
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
