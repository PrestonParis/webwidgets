import { parseCSV } from '@/features/tracking/lib/import/csvParser';
import type { WorkoutImportProvider } from '@/features/tracking/types/fitnessProviders';
import type {
    ExerciseEntry,
    SetEntry,
    WorkoutSession,
} from '@/features/tracking/types/fitness';
import type { ImportPreview } from '@/features/tracking/types/fitnessImport';
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

function buildSetEntry(row: Record<string, string>): SetEntry {
    const set: SetEntry = {
        setType: numberValue(row, ['distance'])
            ? 'distance'
            : numberValue(row, ['duration', 'duration seconds'])
              ? 'timed'
              : 'working',
        completed: true,
    };
    const reps = numberValue(row, ['reps']);
    const weight = numberValue(row, ['weight', 'weight lb', 'weight_lbs']);
    const durationSeconds = numberValue(row, ['duration seconds']);
    const distance = numberValue(row, ['distance']);
    const rpe = numberValue(row, ['rpe']);
    if (reps !== undefined) set.reps = reps;
    if (weight !== undefined) set.weight = weight;
    if (durationSeconds !== undefined) set.durationSeconds = durationSeconds;
    if (distance !== undefined) set.distance = distance;
    if (rpe !== undefined) set.rpe = rpe;
    return set;
}

function buildExerciseEntry(
    row: Record<string, string>,
    exerciseName: string,
): ExerciseEntry {
    const set = buildSetEntry(row);
    return {
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
}

function buildWorkoutSession(
    row: Record<string, string>,
    date: string,
    workoutName: string,
    exercise: ExerciseEntry,
    key: string,
): WorkoutSession {
    const set = exercise.sets[0]!;
    const totals = calculateWorkoutTotals([exercise]);
    const session: WorkoutSession = {
        id: `csv-${row.rowIndex}`,
        date: date ?? '',
        durationMinutes:
            numberValue(row, ['duration', 'duration minutes']) ??
            Math.round((set.durationSeconds ?? 0) / 60),
        workoutType: normalizeWorkoutType(
            value(row, ['workout type', 'activity type', 'type']),
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
    const caloriesBurned = numberValue(row, ['calories']);
    const averageHeartRate = numberValue(row, [
        'heart rate',
        'average heart rate',
    ]);
    const notes = value(row, ['notes']);
    const distance = numberValue(row, ['distance']);
    if (distance !== undefined) session.distance = distance;
    if (caloriesBurned !== undefined) session.caloriesBurned = caloriesBurned;
    if (averageHeartRate !== undefined)
        session.averageHeartRate = averageHeartRate;
    if (notes !== undefined) session.notes = notes;
    return session;
}

function processRow(
    row: { raw: Record<string, string>; rowIndex: number },
    seen: Set<string>,
): {
    rowIndex: number;
    status: 'ready' | 'skipped' | 'duplicate';
    issues: string[];
    session?: WorkoutSession;
} {
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

    if (issues.length === 0 && !duplicate) {
        const exercise = buildExerciseEntry(row.raw, exerciseName ?? '');
        const session = buildWorkoutSession(
            row.raw,
            date ?? '',
            workoutName,
            exercise,
            key,
        );
        return {
            rowIndex: row.rowIndex,
            status: 'ready',
            issues: [],
            session,
        };
    }

    return {
        rowIndex: row.rowIndex,
        status: duplicate ? 'duplicate' : 'skipped',
        issues: duplicate ? ['Duplicate workout row'] : issues,
    };
}

export function mapFitnessCsv(input: string): ImportPreview {
    const parsed = parseCSV(input);
    const seen = new Set<string>();
    const rows = parsed.map((row) => processRow(row, seen));

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
    preview(input: string) {
        return Promise.resolve(mapFitnessCsv(input));
    },
    commit(rows: WorkoutSession[]) {
        return Promise.resolve({
            imported: rows.length,
            skipped: 0,
            errors: [],
        });
    },
};
