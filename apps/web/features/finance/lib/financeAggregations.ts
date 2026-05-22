import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

const ASSET_TYPES = new Set([
    'cash',
    'checking',
    'savings',
    'investment',
    'other',
]);
const CASH_TYPES = new Set(['cash', 'checking', 'savings']);
const LIABILITY_TYPES = new Set(['credit', 'loan']);

export function filterToCurrentMonth(
    transactions: FinanceTransaction[],
): FinanceTransaction[] {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return transactions.filter((tx) =>
        (tx.date || tx.occurredOn).startsWith(prefix),
    );
}

export function filterToLastNDays(
    transactions: FinanceTransaction[],
    days: number,
): FinanceTransaction[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return transactions.filter((tx) => (tx.date || tx.occurredOn) >= cutoffStr);
}

export function calculateNetWorth(accounts: FinanceAccount[]) {
    return accounts.reduce((total, account) => total + account.balance, 0);
}

export function calculateMonthlyBurnRate(transactions: FinanceTransaction[]) {
    return calculateFinanceOverview([], transactions, []).monthlyExpenses;
}

export function detectSubscriptionsPlaceholder(
    transactions: FinanceTransaction[],
): FinanceSubscription[] {
    void transactions;
    return [];
}

export function toMonthlySubscriptionAmount(subscription: FinanceSubscription) {
    if (!subscription.active) return 0;
    if (
        subscription.billingCycle === 'yearly' ||
        subscription.cadence === 'annual'
    )
        return subscription.amount / 12;
    if (
        subscription.billingCycle === 'weekly' ||
        subscription.cadence === 'weekly'
    )
        return subscription.amount * 4.33;
    return subscription.amount;
}

export function getCategoryBreakdown(
    transactions: FinanceTransaction[],
): Array<{ category: string; amount: number }> {
    const spending = new Map<string, number>();
    for (const tx of transactions) {
        if (tx.type === 'income' || tx.amount > 0) continue;
        spending.set(
            tx.category,
            (spending.get(tx.category) ?? 0) + Math.abs(tx.amount),
        );
    }
    return [...spending.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ category, amount }));
}

export function calculateFinanceOverview(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
) {
    const thisMonth = filterToCurrentMonth(transactions);
    const totalAssets = accounts
        .filter(
            (account) => ASSET_TYPES.has(account.type) || account.balance > 0,
        )
        .reduce((sum, account) => sum + Math.max(account.balance, 0), 0);
    const totalLiabilities = accounts
        .filter(
            (account) =>
                LIABILITY_TYPES.has(account.type) || account.balance < 0,
        )
        .reduce(
            (sum, account) =>
                sum + Math.abs(Math.min(account.balance, 0) || account.balance),
            0,
        );
    const cashTotal = accounts
        .filter((account) => CASH_TYPES.has(account.type))
        .reduce((sum, account) => sum + account.balance, 0);
    const debtTotal = accounts
        .filter((account) => LIABILITY_TYPES.has(account.type))
        .reduce((sum, account) => sum + Math.abs(account.balance), 0);
    const monthlySubscriptionCost = subscriptions.reduce(
        (sum, sub) => sum + toMonthlySubscriptionAmount(sub),
        0,
    );
    const monthlyIncome = thisMonth
        .filter(
            (transaction) =>
                transaction.type === 'income' || transaction.amount > 0,
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const monthlyExpenses = thisMonth
        .filter(
            (transaction) =>
                transaction.type === 'expense' || transaction.amount < 0,
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const netMonthlyCashflow =
        monthlyIncome - monthlyExpenses - monthlySubscriptionCost;
    const topSpendingCategory = getTopSpendingCategory(thisMonth);
    const categoryBreakdown = getCategoryBreakdown(thisMonth);
    const recentTransactions = [...transactions]
        .sort((a, b) =>
            (b.date || b.occurredOn).localeCompare(a.date || a.occurredOn),
        )
        .slice(0, 5);
    const upcomingSubscriptions = subscriptions
        .filter(
            (subscription) =>
                subscription.active && subscription.nextBillingDate,
        )
        .sort((a, b) =>
            (a.nextBillingDate ?? '').localeCompare(b.nextBillingDate ?? ''),
        )
        .slice(0, 5);

    return {
        netWorth: calculateNetWorth(accounts),
        totalAssets,
        totalLiabilities,
        cashTotal,
        debtTotal,
        monthlySubscriptionCost,
        monthlyIncome,
        monthlyExpenses,
        netMonthlyCashflow,
        topSpendingCategory,
        categoryBreakdown,
        recentTransactions,
        upcomingSubscriptions,
    };
}

function getTopSpendingCategory(transactions: FinanceTransaction[]) {
    const spending = new Map<string, number>();
    for (const transaction of transactions) {
        if (transaction.type !== 'expense' && transaction.amount >= 0) continue;
        spending.set(
            transaction.category,
            (spending.get(transaction.category) ?? 0) +
                Math.abs(transaction.amount),
        );
    }

    const top = [...spending.entries()].sort(([, a], [, b]) => b - a)[0];
    return top ? { category: top[0], amount: top[1] } : null;
}
