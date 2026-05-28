import type {
    ExerciseDefinition,
    ExerciseSearchFilters,
} from '@/features/tracking/types/fitness';
import type { ExerciseLibraryProvider } from '@/features/tracking/types/fitnessProviders';

export const LOCAL_EXERCISES: ExerciseDefinition[] = [
    {
        id: 'barbell-bench-press',
        name: 'Barbell Bench Press',
        aliases: ['bench', 'bench press'],
        category: 'strength',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'shoulders'],
        equipment: ['barbell', 'bench'],
        movementPattern: 'horizontal push',
        instructions: [
            'Set shoulder blades, lower the bar under control, press to lockout.',
        ],
        sourceProvider: 'local',
    },
    {
        id: 'back-squat',
        name: 'Back Squat',
        aliases: ['squat'],
        category: 'strength',
        primaryMuscles: ['legs', 'quads', 'glutes'],
        secondaryMuscles: ['hamstrings', 'core'],
        equipment: ['barbell', 'rack'],
        movementPattern: 'squat',
        instructions: ['Brace, descend to depth, drive through mid-foot.'],
        sourceProvider: 'local',
    },
    {
        id: 'deadlift',
        name: 'Deadlift',
        aliases: ['conventional deadlift'],
        category: 'strength',
        primaryMuscles: ['back', 'hamstrings', 'glutes'],
        secondaryMuscles: ['core', 'grip'],
        equipment: ['barbell'],
        movementPattern: 'hinge',
        instructions: [
            'Brace, pull slack from the bar, stand tall without overextending.',
        ],
        sourceProvider: 'local',
    },
    {
        id: 'run',
        name: 'Run',
        aliases: ['running', 'jog'],
        category: 'cardio',
        primaryMuscles: ['legs'],
        secondaryMuscles: ['calves', 'core'],
        equipment: ['none'],
        movementPattern: 'locomotion',
        instructions: [
            'Track duration, distance, pace, and heart rate when available.',
        ],
        sourceProvider: 'local',
    },
    {
        id: 'plank',
        name: 'Plank',
        aliases: ['front plank'],
        category: 'strength',
        primaryMuscles: ['core'],
        secondaryMuscles: ['shoulders', 'glutes'],
        equipment: ['none'],
        movementPattern: 'anti-extension',
        instructions: [
            'Keep ribs down, squeeze glutes, and hold a straight line.',
        ],
        sourceProvider: 'local',
    },
];

const cache = new Map<string, ExerciseDefinition[]>();

function matchesText(exercise: ExerciseDefinition, query: string): boolean {
    const haystack = [
        exercise.name,
        ...exercise.aliases,
        ...exercise.primaryMuscles,
        ...exercise.secondaryMuscles,
        ...exercise.equipment,
    ]
        .join(' ')
        .toLowerCase();
    return haystack.includes(query.toLowerCase());
}

export const localExerciseLibraryProvider: ExerciseLibraryProvider = {
    id: 'local-exercise-library',
    label: 'Local exercise library',
    search(filters: ExerciseSearchFilters): Promise<ExerciseDefinition[]> {
        const key = JSON.stringify(filters);
        const cached = cache.get(key);
        if (cached) return Promise.resolve(cached);
        const query = filters.query?.trim() ?? '';
        const limit = filters.limit ?? 20;
        const result = LOCAL_EXERCISES.filter((exercise) => {
            if (query && !matchesText(exercise, query)) return false;
            if (
                filters.muscleGroup &&
                ![
                    ...exercise.primaryMuscles,
                    ...exercise.secondaryMuscles,
                ].some(
                    (muscle) =>
                        muscle.toLowerCase() ===
                        filters.muscleGroup?.toLowerCase(),
                )
            )
                return false;
            if (
                filters.equipment &&
                !exercise.equipment.some(
                    (item) =>
                        item.toLowerCase() === filters.equipment?.toLowerCase(),
                )
            )
                return false;
            if (
                filters.movementPattern &&
                exercise.movementPattern?.toLowerCase() !==
                    filters.movementPattern.toLowerCase()
            )
                return false;
            return true;
        }).slice(0, limit);
        cache.set(key, result);
        return Promise.resolve(result);
    },
    getById(id: string): Promise<ExerciseDefinition | null> {
        return Promise.resolve(
            LOCAL_EXERCISES.find((exercise) => exercise.id === id) ?? null,
        );
    },
};
