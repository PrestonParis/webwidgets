import type {
    EntrySource,
    TrackingEntry,
} from '@/features/tracking/types/tracking';

export type WorkoutType =
    | 'strength'
    | 'cardio'
    | 'mobility'
    | 'sport'
    | 'mixed'
    | 'other';

export type ExerciseCategory =
    | 'strength'
    | 'cardio'
    | 'mobility'
    | 'sport'
    | 'other';

export type SetType =
    | 'warmup'
    | 'working'
    | 'drop'
    | 'failure'
    | 'timed'
    | 'distance';

export interface SetEntry {
    setType: SetType;
    reps?: number;
    weight?: number;
    durationSeconds?: number;
    distance?: number;
    resistance?: number;
    rpe?: number;
    completed: boolean;
    notes?: string;
}

export interface ExerciseEntry {
    exerciseId: string;
    name: string;
    category: ExerciseCategory;
    muscleGroups: string[];
    equipment: string[];
    sets: SetEntry[];
    notes?: string;
}

export interface ExerciseDefinition {
    id: string;
    name: string;
    aliases: string[];
    category: ExerciseCategory;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string[];
    movementPattern?: string;
    instructions: string[];
    mediaUrl?: string;
    sourceProvider: string;
    externalExerciseId?: string;
}

export interface WorkoutSession {
    id: string;
    date: string;
    startTime?: string;
    endTime?: string;
    durationMinutes: number;
    workoutType: WorkoutType;
    title: string;
    exercises: ExerciseEntry[];
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    distance?: number;
    caloriesBurned?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    perceivedExertion?: number;
    notes?: string;
    tags: string[];
    source: EntrySource | 'manual' | 'imported';
    sourceProvider?: string;
    externalId?: string;
    createdAt: string;
    updatedAt?: string;
    rawEntry?: TrackingEntry;
}

export interface WorkoutTemplateExercise {
    exerciseId: string;
    name: string;
    targetSets: Array<{
        setType: SetType;
        reps?: number;
        weight?: number;
        durationSeconds?: number;
        distance?: number;
        rpe?: number;
    }>;
    notes?: string;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    workoutType: WorkoutType;
    exercises: WorkoutTemplateExercise[];
    tags: string[];
    createdAt: string;
    updatedAt?: string;
}

export type FitnessGoalType =
    | 'workouts_per_week'
    | 'strength_volume'
    | 'exercise_strength'
    | 'cardio_distance'
    | 'cardio_duration'
    | 'calories_burned'
    | 'mobility_minutes'
    | 'active_days'
    | 'muscle_frequency';

export interface FitnessGoalConfig {
    type: FitnessGoalType;
    targetValue: number;
    exerciseId?: string;
    exerciseName?: string;
    muscleGroup?: string;
    unit:
        | 'workouts'
        | 'lb'
        | 'kg'
        | 'minutes'
        | 'miles'
        | 'km'
        | 'calories'
        | 'days';
    period: 'week' | 'month' | 'all_time';
}

export interface PersonalRecord {
    id: string;
    exerciseId: string;
    exerciseName: string;
    type:
        | 'estimated_1rm'
        | 'max_weight'
        | 'max_reps'
        | 'best_volume_set'
        | 'longest_duration'
        | 'fastest_pace'
        | 'longest_distance';
    value: number;
    unit: string;
    date: string;
    workoutId: string;
    previousValue?: number;
}

export interface FitnessAnalytics {
    sessions: WorkoutSession[];
    latestWorkout: WorkoutSession | null;
    weeklyWorkoutCount: number;
    weeklyDuration: number;
    weeklyVolume: number;
    weeklyDistance: number;
    previousWeeklyVolume: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    prs: PersonalRecord[];
    recentPrs: PersonalRecord[];
    muscleGroupFrequency: Record<string, number>;
    insights: string[];
}

export interface ExerciseSearchFilters {
    query?: string;
    muscleGroup?: string;
    equipment?: string;
    movementPattern?: string;
    includeCustom?: boolean;
    limit?: number;
}

export interface ImportPreviewRow {
    rowIndex: number;
    status: 'ready' | 'duplicate' | 'skipped';
    issues: string[];
    session?: WorkoutSession;
}

export interface ImportPreview {
    provider: string;
    total: number;
    ready: number;
    duplicates: number;
    skipped: number;
    rows: ImportPreviewRow[];
}
