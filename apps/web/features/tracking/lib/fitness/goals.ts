import type { TrackingGoal } from '@/features/tracking/types/goals';
import type { FitnessGoalConfig, WorkoutSession } from './types';

export function parseFitnessGoal(goal: TrackingGoal | null): FitnessGoalConfig {
    if (!goal) {
        return {
            type: 'workouts_per_week',
            targetValue: 4,
            unit: 'workouts',
            period: 'week',
        };
    }
    const metric = goal.metricKey ?? 'workouts_per_week';
    if (metric === 'strength_volume') {
        return {
            type: 'strength_volume',
            targetValue: goal.targetValue,
            unit: 'lb',
            period: 'week',
        };
    }
    if (metric === 'cardio_distance') {
        return {
            type: 'cardio_distance',
            targetValue: goal.targetValue,
            unit: 'miles',
            period: 'week',
        };
    }
    if (metric === 'cardio_duration' || metric === 'mobility_minutes') {
        return {
            type: metric,
            targetValue: goal.targetValue,
            unit: 'minutes',
            period: 'week',
        };
    }
    if (metric === 'calories_burned') {
        return {
            type: 'calories_burned',
            targetValue: goal.targetValue,
            unit: 'calories',
            period: 'week',
        };
    }
    if (metric === 'active_days') {
        return {
            type: 'active_days',
            targetValue: goal.targetValue,
            unit: 'days',
            period: 'week',
        };
    }
    return {
        type: 'workouts_per_week',
        targetValue: goal.targetValue,
        unit: 'workouts',
        period: 'week',
    };
}

export function describeFitnessGoal(goal: FitnessGoalConfig): string {
    if (goal.type === 'workouts_per_week')
        return `Work out ${goal.targetValue} times per week.`;
    if (goal.type === 'strength_volume')
        return `Lift ${goal.targetValue.toLocaleString()} ${goal.unit} per week.`;
    if (goal.type === 'cardio_distance')
        return `Run ${goal.targetValue} ${goal.unit} per week.`;
    if (goal.type === 'cardio_duration')
        return `Do ${goal.targetValue} minutes of cardio per week.`;
    if (goal.type === 'mobility_minutes')
        return `Do ${goal.targetValue} mobility minutes per week.`;
    if (goal.type === 'calories_burned')
        return `Burn ${goal.targetValue} calories in workouts per week.`;
    if (goal.type === 'active_days')
        return `Be active ${goal.targetValue} days per week.`;
    if (goal.type === 'exercise_strength')
        return `${goal.exerciseName ?? 'Exercise'} ${goal.targetValue} ${goal.unit}.`;
    return `Train ${goal.muscleGroup ?? 'target muscle'} ${goal.targetValue} times per week.`;
}

export function calculateFitnessGoalProgress(
    goal: FitnessGoalConfig,
    weeklySessions: WorkoutSession[],
): {
    value: number;
    target: number;
    ratio: number;
    label: string;
} {
    let value = weeklySessions.length;
    if (goal.type === 'strength_volume') {
        value = weeklySessions.reduce(
            (sum, session) => sum + session.totalVolume,
            0,
        );
    } else if (goal.type === 'cardio_distance') {
        value = weeklySessions.reduce(
            (sum, session) => sum + (session.distance ?? 0),
            0,
        );
    } else if (goal.type === 'cardio_duration') {
        value = weeklySessions
            .filter((session) => session.workoutType === 'cardio')
            .reduce((sum, session) => sum + session.durationMinutes, 0);
    } else if (goal.type === 'mobility_minutes') {
        value = weeklySessions
            .filter((session) => session.workoutType === 'mobility')
            .reduce((sum, session) => sum + session.durationMinutes, 0);
    } else if (goal.type === 'calories_burned') {
        value = weeklySessions.reduce(
            (sum, session) => sum + (session.caloriesBurned ?? 0),
            0,
        );
    } else if (goal.type === 'active_days') {
        value = new Set(weeklySessions.map((session) => session.date)).size;
    }
    const ratio =
        goal.targetValue > 0 ? Math.min(1, value / goal.targetValue) : 0;
    return {
        value,
        target: goal.targetValue,
        ratio,
        label: `${Math.round(value * 10) / 10}/${goal.targetValue} ${goal.unit}`,
    };
}
