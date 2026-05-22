import type {
    SleepMetadata,
    WorkoutMetadata,
    MealMetadata,
    MoodMetadata,
    SupplementMetadata,
    SymptomMetadata,
    InjuryMetadata,
} from './metadata';

export function isSleepMeta(m: unknown): m is SleepMetadata {
    return (
        typeof m === 'object' &&
        m !== null &&
        ('bedtime' in m ||
            'wakeTime' in m ||
            'quality' in m ||
            'durationHours' in m)
    );
}

export function isWorkoutMeta(m: unknown): m is WorkoutMetadata {
    return (
        typeof m === 'object' &&
        m !== null &&
        ('workoutType' in m || 'duration' in m || 'intensity' in m)
    );
}

export function isMealMeta(m: unknown): m is MealMetadata {
    return (
        typeof m === 'object' &&
        m !== null &&
        ('mealType' in m || 'description' in m || 'calories' in m)
    );
}

export function isMoodMeta(m: unknown): m is MoodMetadata {
    return (
        typeof m === 'object' &&
        m !== null &&
        'score' in m &&
        typeof (m as Record<string, unknown>)['score'] === 'number'
    );
}

export function isSupplementMeta(m: unknown): m is SupplementMetadata {
    if (typeof m !== 'object' || m === null) return false;
    const obj = m as Record<string, unknown>;
    return typeof obj['name'] === 'string' && typeof obj['taken'] === 'boolean';
}

export function isSymptomMeta(m: unknown): m is SymptomMetadata {
    if (typeof m !== 'object' || m === null) return false;
    const obj = m as Record<string, unknown>;
    return typeof obj['name'] === 'string' && !('taken' in m);
}

export function isInjuryMeta(m: unknown): m is InjuryMetadata {
    return (
        typeof m === 'object' &&
        m !== null &&
        typeof (m as Record<string, unknown>)['location'] === 'string'
    );
}
