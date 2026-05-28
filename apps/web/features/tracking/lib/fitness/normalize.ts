import type {
    TrackingEntry,
    TrackingMetadata,
} from '@/features/tracking/types/trackingEntries';
import type {
    ExerciseCategory,
    ExerciseEntry,
    SetEntry,
    SetType,
    WorkoutSession,
    WorkoutType,
} from '@/features/tracking/types/fitness';
import { str, positive, stringArray } from './readers';

const TYPE_MAP: Record<string, WorkoutType> = {
    strength: 'strength',
    lifting: 'strength',
    weights: 'strength',
    weightlifting: 'strength',
    run: 'cardio',
    running: 'cardio',
    bike: 'cardio',
    cycling: 'cardio',
    cardio: 'cardio',
    yoga: 'mobility',
    mobility: 'mobility',
    stretch: 'mobility',
    sport: 'sport',
    mixed: 'mixed',
};

export function normalizeWorkoutType(value: unknown): WorkoutType {
    const raw = str(value)?.toLowerCase();
    if (!raw) return 'other';
    return TYPE_MAP[raw] ?? TYPE_MAP[raw.replace(/\s+/g, '')] ?? 'other';
}

function normalizeSet(raw: unknown): SetEntry | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const setTypeRaw = str(record['setType'] ?? record['type'])?.toLowerCase();
    const setType: SetType =
        setTypeRaw === 'warmup' ||
        setTypeRaw === 'drop' ||
        setTypeRaw === 'failure' ||
        setTypeRaw === 'timed' ||
        setTypeRaw === 'distance'
            ? setTypeRaw
            : 'working';
    const set: SetEntry = {
        setType,
        completed:
            typeof record['completed'] === 'boolean'
                ? record['completed']
                : true,
    };
    const reps = positive(record['reps']);
    const weight = positive(
        record['weight'] ?? record['weightLb'] ?? record['weight_lbs'],
    );
    const durationSeconds = positive(
        record['durationSeconds'] ?? record['duration_seconds'],
    );
    const distance = positive(record['distance']);
    const resistance = positive(record['resistance']);
    const rpe = positive(record['rpe'] ?? record['RPE']);
    const notes = str(record['notes']);
    if (reps !== undefined) set.reps = reps;
    if (weight !== undefined) set.weight = weight;
    if (durationSeconds !== undefined) set.durationSeconds = durationSeconds;
    if (distance !== undefined) set.distance = distance;
    if (resistance !== undefined) set.resistance = resistance;
    if (rpe !== undefined) set.rpe = Math.min(10, rpe);
    if (notes !== undefined) set.notes = notes;
    return set;
}

function normalizeExercise(raw: unknown): ExerciseEntry | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const name = str(
        record['name'] ?? record['exerciseName'] ?? record['exercise_name'],
    );
    if (!name) return null;
    const category = (str(record['category']) ??
        'strength') as ExerciseCategory;
    const sets = Array.isArray(record['sets'])
        ? record['sets']
              .map(normalizeSet)
              .filter((set): set is SetEntry => set !== null)
        : [];
    const notes = str(record['notes']);
    const exercise: ExerciseEntry = {
        exerciseId:
            str(
                record['exerciseId'] ?? record['exercise_id'] ?? record['id'],
            ) ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        category,
        muscleGroups: stringArray(record['muscleGroups'] ?? record['muscles']),
        equipment: stringArray(record['equipment']),
        sets,
    };
    if (notes !== undefined) exercise.notes = notes;
    return exercise;
}

function fallbackExercise(meta: TrackingMetadata): ExerciseEntry[] {
    const name = str(
        meta['exerciseName'] ?? meta['exercise'] ?? meta['workoutType'],
    );
    const reps = positive(meta['reps']);
    const weight = positive(meta['weight']);
    const setsCount = positive(meta['sets']);
    if (!name && !reps && !weight && !setsCount) return [];
    const set: SetEntry = {
        setType: 'working',
        completed: true,
        ...(reps !== undefined && { reps }),
        ...(weight !== undefined && { weight }),
    };
    const count = Math.max(1, Math.min(20, Math.round(setsCount ?? 1)));
    return [
        {
            exerciseId: (name ?? 'workout')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-'),
            name: name ?? 'Workout',
            category: 'strength',
            muscleGroups: stringArray(meta['muscleGroups']),
            equipment: stringArray(meta['equipment']),
            sets: Array.from({ length: count }, () => ({ ...set })),
        },
    ];
}

export function calculateWorkoutTotals(exercises: ExerciseEntry[]): {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
} {
    return exercises.reduce(
        (acc, exercise) => {
            for (const set of exercise.sets) {
                if (!set.completed) continue;
                acc.totalSets += 1;
                acc.totalReps += set.reps ?? 0;
                acc.totalVolume +=
                    (set.reps ?? 0) * (set.weight ?? set.resistance ?? 0);
            }
            return acc;
        },
        { totalVolume: 0, totalSets: 0, totalReps: 0 },
    );
}

export function normalizeWorkoutEntry(
    entry: TrackingEntry,
): WorkoutSession | null {
    if (entry.category !== 'workout') return null;
    const meta = entry.metadata ?? {};
    const exercises = Array.isArray(meta['exercises'])
        ? meta['exercises']
              .map(normalizeExercise)
              .filter(
                  (exercise): exercise is ExerciseEntry => exercise !== null,
              )
        : fallbackExercise(meta);
    const totals = calculateWorkoutTotals(exercises);
    const durationMinutes =
        positive(meta['durationMinutes'] ?? meta['duration']) ?? 0;
    const workoutType = normalizeWorkoutType(
        meta['workoutType'] ?? meta['type'],
    );
    const title =
        str(meta['title'] ?? meta['name'] ?? meta['workoutName']) ??
        (workoutType === 'other'
            ? 'Workout'
            : `${workoutType[0]?.toUpperCase()}${workoutType.slice(1)} workout`);
    const totalVolume = positive(meta['totalVolume']) ?? totals.totalVolume;
    const totalSets = positive(meta['totalSets']) ?? totals.totalSets;
    const totalReps = positive(meta['totalReps']) ?? totals.totalReps;
    const session: WorkoutSession = {
        id: entry.id,
        date: entry.entryDate,
        durationMinutes,
        workoutType,
        title,
        exercises,
        totalVolume,
        totalSets,
        totalReps,
        tags: entry.tags,
        source: entry.source,
        createdAt: entry.createdAt,
        rawEntry: entry,
    };
    const startTime = str(meta['startTime']);
    const endTime = str(meta['endTime']);
    const distance = positive(meta['distance']);
    const caloriesBurned = positive(meta['caloriesBurned'] ?? meta['calories']);
    const averageHeartRate = positive(
        meta['averageHeartRate'] ?? meta['avgHeartRate'],
    );
    const maxHeartRate = positive(meta['maxHeartRate']);
    const perceivedExertion = positive(
        meta['perceivedExertion'] ?? meta['rpe'] ?? meta['intensity'],
    );
    const sourceProvider = str(meta['sourceProvider']);
    const externalId = str(meta['externalId']);
    if (startTime !== undefined) session.startTime = startTime;
    if (endTime !== undefined) session.endTime = endTime;
    if (distance !== undefined) session.distance = distance;
    if (caloriesBurned !== undefined) session.caloriesBurned = caloriesBurned;
    if (averageHeartRate !== undefined)
        session.averageHeartRate = averageHeartRate;
    if (maxHeartRate !== undefined) session.maxHeartRate = maxHeartRate;
    if (perceivedExertion !== undefined)
        session.perceivedExertion = perceivedExertion;
    if (entry.notes !== undefined) session.notes = entry.notes;
    if (sourceProvider !== undefined) session.sourceProvider = sourceProvider;
    if (externalId !== undefined) session.externalId = externalId;
    return session;
}

export function normalizeWorkoutEntries(
    entries: TrackingEntry[],
): WorkoutSession[] {
    return entries
        .map(normalizeWorkoutEntry)
        .filter((session): session is WorkoutSession => session !== null)
        .sort(
            (a, b) =>
                b.date.localeCompare(a.date) ||
                b.createdAt.localeCompare(a.createdAt),
        );
}

export function workoutToTrackingMetadata(
    session: Omit<WorkoutSession, 'id' | 'createdAt' | 'tags' | 'source'>,
): TrackingMetadata {
    return {
        title: session.title,
        workoutType: session.workoutType,
        durationMinutes: session.durationMinutes,
        duration: session.durationMinutes,
        exercises: session.exercises,
        totalVolume: session.totalVolume,
        totalSets: session.totalSets,
        totalReps: session.totalReps,
        ...(session.distance !== undefined && { distance: session.distance }),
        ...(session.caloriesBurned !== undefined && {
            caloriesBurned: session.caloriesBurned,
        }),
        ...(session.averageHeartRate !== undefined && {
            averageHeartRate: session.averageHeartRate,
        }),
        ...(session.maxHeartRate !== undefined && {
            maxHeartRate: session.maxHeartRate,
        }),
        ...(session.perceivedExertion !== undefined && {
            perceivedExertion: session.perceivedExertion,
            intensity: session.perceivedExertion,
        }),
        ...(session.sourceProvider !== undefined && {
            sourceProvider: session.sourceProvider,
        }),
        ...(session.externalId !== undefined && {
            externalId: session.externalId,
        }),
    };
}
