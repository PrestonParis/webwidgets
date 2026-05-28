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
