import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/supabase';
import type { FinanceAccount } from '@/features/finance/types/finance';
import {
    createFinanceAccountForUser,
    listFinanceAccountsForUser,
} from './financeAccountService';
import { listFinanceSubscriptionsForUser } from './financeSubscriptionService';
import { listFinanceTransactionsForUser } from './financeTransactionService';

const defaultClient = db as unknown as SupabaseClient;

export async function listFinanceAccounts(userId: string) {
    return listFinanceAccountsForUser(defaultClient, userId);
}

export async function listFinanceTransactions(userId: string) {
    return listFinanceTransactionsForUser(defaultClient, userId);
}

export async function listFinanceSubscriptions(userId: string) {
    return listFinanceSubscriptionsForUser(defaultClient, userId);
}

export async function createFinanceAccount(
    input: Omit<FinanceAccount, 'id' | 'createdAt' | 'updatedAt'>,
) {
    return createFinanceAccountForUser(defaultClient, input);
}
