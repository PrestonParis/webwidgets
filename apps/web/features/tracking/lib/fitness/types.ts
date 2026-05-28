import type { EntrySource } from '@/features/tracking/types/trackingCategoryTypes';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

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

export interface ExerciseSearchFilters {
    query?: string;
    muscleGroup?: string;
    equipment?: string;
    movementPattern?: string;
    includeCustom?: boolean;
    limit?: number;
}
