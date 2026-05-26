import { parseCSV } from '@/features/tracking/lib/import/csvParser';
import type { WorkoutImportProvider } from './types';
import type {
    ExerciseEntry,
    ImportPreview,
    SetEntry,
    WorkoutSession,
} from '../types';
import { calculateWorkoutTotals, normalizeWorkoutType } from '../normalize';

function value(
    row: Record<string, string>,
    keys: string[],
): string | undefined {
    for (const key of keys) {
        const found = row[key] ?? row[key.toLowerCase()];
        if (found !== undefined && found !== '') return found;
    }
    return undefined;
}

function numberValue(
    row: Record<string, string>,
    keys: string[],
): number | undefined {
    const raw = value(row, keys);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function mapFitnessCsv(input: string): ImportPreview {
    const parsed = parseCSV(input);
    const seen = new Set<string>();
    const rows = parsed.map((row) => {
        const date = value(row.raw, ['date', 'workout date', 'entry_date']);
        const exerciseName = value(row.raw, [
            'exercise name',
            'exercise',
            'movement',
        ]);
        const workoutName =
            value(row.raw, ['workout name', 'workout', 'name']) ??
            'Imported workout';
        const issues: string[] = [];
        if (!date) issues.push('Missing date');
        if (!exerciseName) issues.push('Missing exercise name');
        const key = `${date ?? 'missing'}:${workoutName}:${exerciseName}:${value(row.raw, ['set number', 'set']) ?? row.rowIndex}`;
        const duplicate = seen.has(key);
        seen.add(key);
        const set: SetEntry = {
            setType: numberValue(row.raw, ['distance'])
                ? 'distance'
                : numberValue(row.raw, ['duration', 'duration seconds'])
                  ? 'timed'
                  : 'working',
            completed: true,
        };
        const reps = numberValue(row.raw, ['reps']);
        const weight = numberValue(row.raw, [
            'weight',
            'weight lb',
            'weight_lbs',
        ]);
        const durationSeconds = numberValue(row.raw, ['duration seconds']);
        const distance = numberValue(row.raw, ['distance']);
        const rpe = numberValue(row.raw, ['rpe']);
        if (reps !== undefined) set.reps = reps;
        if (weight !== undefined) set.weight = weight;
        if (durationSeconds !== undefined)
            set.durationSeconds = durationSeconds;
        if (distance !== undefined) set.distance = distance;
        if (rpe !== undefined) set.rpe = rpe;
        const exercise: ExerciseEntry = {
            exerciseId: (exerciseName ?? 'exercise')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-'),
            name: exerciseName ?? 'Exercise',
            category:
                set.setType === 'distance' || set.setType === 'timed'
                    ? 'cardio'
                    : 'strength',
            muscleGroups: [],
            equipment: [],
            sets: [set],
        };
        const totals = calculateWorkoutTotals([exercise]);
        const session: WorkoutSession = {
            id: `csv-${row.rowIndex}`,
            date: date ?? '',
            durationMinutes:
                numberValue(row.raw, ['duration', 'duration minutes']) ??
                Math.round((set.durationSeconds ?? 0) / 60),
            workoutType: normalizeWorkoutType(
                value(row.raw, ['workout type', 'activity type', 'type']),
            ),
            title: workoutName,
            exercises: [exercise],
            ...totals,
            tags: [],
            source: 'import',
            sourceProvider: 'csv',
            externalId: key,
            createdAt: new Date().toISOString(),
        };
        const caloriesBurned = numberValue(row.raw, ['calories']);
        const averageHeartRate = numberValue(row.raw, [
            'heart rate',
            'average heart rate',
        ]);
        const notes = value(row.raw, ['notes']);
        if (distance !== undefined) session.distance = distance;
        if (caloriesBurned !== undefined)
            session.caloriesBurned = caloriesBurned;
        if (averageHeartRate !== undefined)
            session.averageHeartRate = averageHeartRate;
        if (notes !== undefined) session.notes = notes;
        return {
            rowIndex: row.rowIndex,
            status: duplicate
                ? ('duplicate' as const)
                : issues.length > 0
                  ? ('skipped' as const)
                  : ('ready' as const),
            issues: duplicate ? ['Duplicate workout row'] : issues,
            ...(issues.length === 0 && !duplicate && { session }),
        };
    });
    return {
        provider: 'csv',
        total: rows.length,
        ready: rows.filter((row) => row.status === 'ready').length,
        duplicates: rows.filter((row) => row.status === 'duplicate').length,
        skipped: rows.filter((row) => row.status === 'skipped').length,
        rows,
    };
}

export const fitnessCsvImportProvider: WorkoutImportProvider = {
    id: 'fitness-csv',
    label: 'Workout CSV',
    configured: true,
    async preview(input: string) {
        return mapFitnessCsv(input);
    },
    async commit(rows: WorkoutSession[]) {
        return { imported: rows.length, skipped: 0, errors: [] };
    },
};
