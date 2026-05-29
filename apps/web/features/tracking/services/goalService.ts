import type { SupabaseClient } from '@supabase/supabase-js';
import { rowToGoal } from '@/features/tracking/types/goals';
import type { TrackingGoal, DbGoalRow } from '@/features/tracking/types/goals';

export async function listGoals(
    supabase: SupabaseClient,
    userId: string,
): Promise<TrackingGoal[]> {
    const response = await supabase
        .from('tracking_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);
    const { error } = response;
    const data = response.data as unknown as DbGoalRow[] | null;
    if (error) throw error;
    return (data ?? []).map((r) => rowToGoal(r));
}

export async function getGoal(
    supabase: SupabaseClient,
    userId: string,
    category: string,
): Promise<TrackingGoal | null> {
    const response = await supabase
        .from('tracking_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('active', true)
        .maybeSingle();
    const { error } = response;
    const data = response.data as unknown as DbGoalRow | null;
    if (error) throw error;
    return data ? rowToGoal(data) : null;
}

export async function upsertGoal(
    supabase: SupabaseClient,
    userId: string,
    goal: Omit<TrackingGoal, 'id' | 'userId' | 'createdAt'>,
): Promise<TrackingGoal> {
    const response = await supabase
        .from('tracking_goals')
        .upsert(
            {
                user_id: userId,
                category: goal.category,
                target_type: goal.targetType,
                metric_key: goal.metricKey ?? null,
                target_value: goal.targetValue,
                active: true,
            },
            { onConflict: 'user_id,category' },
        )
        .select()
        .single();
    const { error } = response;
    const data = response.data as unknown as DbGoalRow;
    if (error) throw error;
    return rowToGoal(data);
}

export async function deleteGoal(
    supabase: SupabaseClient,
    userId: string,
    category: string,
): Promise<void> {
    const { error } = await supabase
        .from('tracking_goals')
        .delete()
        .eq('user_id', userId)
        .eq('category', category);
    if (error) throw error;
}
