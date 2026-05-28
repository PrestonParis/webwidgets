import type {
    ExerciseEntry,
    SetEntry,
    SetType,
} from '@/features/tracking/types/fitness';

export const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
export const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';
export const btnCls =
    'px-2 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 transition-colors';

export const SET_TYPES: SetType[] = [
    'warmup',
    'working',
    'drop',
    'failure',
    'timed',
    'distance',
];

export function makeExercise(): ExerciseEntry {
    return {
        exerciseId: `custom-${Date.now()}`,
        name: '',
        category: 'strength',
        muscleGroups: [],
        equipment: [],
        sets: [{ setType: 'working', completed: true, reps: 8, weight: 0 }],
    };
}

export function makeSet(previous?: SetEntry): SetEntry {
    return {
        setType: previous?.setType ?? 'working',
        completed: false,
        ...(previous?.reps !== undefined && { reps: previous.reps }),
        ...(previous?.weight !== undefined && { weight: previous.weight }),
        ...(previous?.durationSeconds !== undefined && {
            durationSeconds: previous.durationSeconds,
        }),
        ...(previous?.distance !== undefined && {
            distance: previous.distance,
        }),
        ...(previous?.rpe !== undefined && { rpe: previous.rpe }),
    };
}

export function numericSetPatch(
    key: 'reps' | 'weight' | 'durationSeconds' | 'rpe',
    value: string,
): Partial<SetEntry> {
    if (!value) return {};
    return { [key]: Number(value) };
}
