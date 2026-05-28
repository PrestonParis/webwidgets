import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceAccount } from '@/features/finance/types/finance';
import { accountPayload } from './financePayloads';
import { rowToAccount, type DbRow } from './financeRowMappers';

export async function listFinanceAccountsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToAccount(row as DbRow));
}

export async function createFinanceAccountForUser(
    supabase: SupabaseClient,
    input: Omit<FinanceAccount, 'id' | 'createdAt' | 'updatedAt'>,
) {
    const result = await supabase
        .from('finance_accounts')
        .insert({ user_id: input.userId, ...accountPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToAccount(result.data as DbRow);
}

export async function updateFinanceAccountForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<FinanceAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
) {
    const result = await supabase
        .from('finance_accounts')
        .update(accountPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToAccount(result.data as DbRow);
}

export async function deleteFinanceAccountForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}
