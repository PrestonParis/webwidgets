import type { WorkoutSession, PersonalRecord } from './types';

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
