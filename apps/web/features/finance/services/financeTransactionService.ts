import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceTransaction } from '@/features/finance/types/finance';
import { transactionPayload } from './financePayloads';
import { rowToTransaction, type DbRow } from './financeRowMappers';

export async function listFinanceTransactionsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_on', { ascending: false })
        .limit(100);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToTransaction(row as DbRow));
}

export async function createFinanceTransactionForUser(
    supabase: SupabaseClient,
    input: Omit<FinanceTransaction, 'id' | 'createdAt' | 'occurredOn'>,
) {
    const result = await supabase
        .from('finance_transactions')
        .insert({ user_id: input.userId, ...transactionPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToTransaction(result.data as DbRow);
}

export async function updateFinanceTransactionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<FinanceTransaction, 'id' | 'userId' | 'createdAt' | 'occurredOn'>
    >,
) {
    const result = await supabase
        .from('finance_transactions')
        .update(transactionPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToTransaction(result.data as DbRow);
}

export async function deleteFinanceTransactionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}
