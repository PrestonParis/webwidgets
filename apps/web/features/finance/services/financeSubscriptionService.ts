import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceSubscription } from '@/features/finance/types/finance';
import { subscriptionPayload } from './financePayloads';
import { rowToSubscription, type DbRow } from './financeRowMappers';

export async function listFinanceSubscriptionsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToSubscription(row as DbRow));
}

export async function createFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    input: Omit<
        FinanceSubscription,
        'id' | 'createdAt' | 'cadence' | 'nextChargeOn'
    >,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .insert({ user_id: input.userId, ...subscriptionPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToSubscription(result.data as DbRow);
}

export async function updateFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >
    >,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .update(subscriptionPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToSubscription(result.data as DbRow);
}

export async function deleteFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}
