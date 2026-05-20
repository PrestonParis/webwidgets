import type { SupabaseClient } from '@supabase/supabase-js';
import {
    listFinanceAccountsForUser,
    listFinanceSubscriptionsForUser,
    listFinanceTransactionsForUser,
} from '@/features/finance/services/financeService';
import { calculateFinanceOverview } from '@/features/finance/lib/financeAggregations';
import { suggestFinanceActions } from '@/features/finance/lib/financePredictions';

const LIABILITY_TYPES = ['credit', 'loan'];

export async function getFinanceSummary(
    supabase: SupabaseClient,
    userId: string,
) {
    const [accounts, transactions, subscriptions] = await Promise.all([
        listFinanceAccountsForUser(supabase, userId),
        listFinanceTransactionsForUser(supabase, userId),
        listFinanceSubscriptionsForUser(supabase, userId),
    ]);
    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const action =
        suggestFinanceActions(accounts, transactions, subscriptions)[0] ?? null;
    const monthlyTotal = subscriptions.reduce((sum, sub) => {
        if (sub.cadence === 'monthly') return sum + sub.amount;
        if (sub.cadence === 'annual' || sub.billingCycle === 'yearly')
            return sum + sub.amount / 12;
        if (sub.cadence === 'weekly') return sum + sub.amount * 4.33;
        return sum;
    }, 0);

    return {
        overview,
        action,
        monthlyTotal,
        topAccounts: accounts
            .filter((account) => !LIABILITY_TYPES.includes(account.type))
            .slice(0, 3),
        accountCount: accounts.length,
    };
}
