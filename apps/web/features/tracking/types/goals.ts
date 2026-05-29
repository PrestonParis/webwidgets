export type GoalTargetType = 'daily_min' | 'weekly_count' | 'daily_log';

export interface TrackingGoal {
    id: string;
    userId: string;
    category: string;
    targetType: GoalTargetType;
    metricKey?: string;
    targetValue: number;
    active: boolean;
    createdAt: string;
}

export interface GoalProgress {
    today: boolean;
    currentStreak: number;
    longestStreak: number;
    weekProgress?: { count: number; target: number } | undefined;
}

export interface DbGoalRow {
    id: string;
    user_id: string;
    category: string;
    target_type: string;
    metric_key: string | null;
    target_value: number;
    active: boolean;
    created_at: string;
}

export function rowToGoal(row: DbGoalRow): TrackingGoal {
    const base = {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        targetType: row.target_type as GoalTargetType,
        targetValue: Number(row.target_value),
        active: row.active,
        createdAt: row.created_at,
    };
    if (row.metric_key !== null) return { ...base, metricKey: row.metric_key };
    return base;
}
