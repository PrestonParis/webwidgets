import type { SetType, WorkoutType } from './types';

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
