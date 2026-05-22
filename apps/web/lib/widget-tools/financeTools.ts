interface AccountLike {
    balance: number;
    type?: string | undefined;
}
interface TransactionLike {
    amount: number;
    type?: string | undefined;
    date?: string | undefined;
    occurredOn?: string | undefined;
    category?: string | undefined;
}
interface SubscriptionLike {
    amount: number;
    billingCycle?: string | undefined;
    active?: boolean | undefined;
}

export function calculateNetWorth(accounts: AccountLike[]): number {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
}

export function calculateTotalAssets(accounts: AccountLike[]): number {
    return accounts
        .filter((a) => a.balance > 0)
        .reduce((sum, a) => sum + a.balance, 0);
}

export function calculateTotalLiabilities(accounts: AccountLike[]): number {
    return accounts
        .filter((a) => a.balance < 0)
        .reduce((sum, a) => sum + Math.abs(a.balance), 0);
}

export function calculateCashflow(
    transactions: TransactionLike[],
    periodDays = 30,
): { income: number; expenses: number; net: number } {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const recent = transactions.filter(
        (tx) => (tx.date || tx.occurredOn || '') >= cutoffStr,
    );
    const income = recent
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const expenses = recent
        .filter((tx) => tx.type !== 'income' && tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    return { income, expenses, net: income - expenses };
}

export function detectRecurringTransactions(
    transactions: TransactionLike[],
): TransactionLike[] {
    const titleCounts = new Map<string, number>();
    return transactions.filter((tx) => {
        const key = String(tx.category ?? '').toLowerCase();
        titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
        return (titleCounts.get(key) ?? 0) >= 2;
    });
}

export function categorizeSpending(
    transactions: TransactionLike[],
): Array<{ category: string; total: number }> {
    const map = new Map<string, number>();
    for (const tx of transactions) {
        if (tx.amount >= 0) continue;
        const cat = tx.category ?? 'uncategorized';
        map.set(cat, (map.get(cat) ?? 0) + Math.abs(tx.amount));
    }
    return [...map.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([category, total]) => ({ category, total }));
}

export function calculateSavingsRate(income: number, expenses: number): number {
    if (income <= 0) return 0;
    return Math.max(0, ((income - expenses) / income) * 100);
}

export function calculateDebtRatio(
    assets: number,
    liabilities: number,
): number {
    if (assets <= 0) return 1;
    return Math.min(1, liabilities / assets);
}

export function calculateSubscriptionBurden(
    subscriptions: SubscriptionLike[],
): number {
    return subscriptions
        .filter((s) => s.active !== false)
        .reduce((sum, s) => {
            const monthly =
                s.billingCycle === 'yearly'
                    ? s.amount / 12
                    : s.billingCycle === 'weekly'
                      ? s.amount * 4.33
                      : s.amount;
            return sum + monthly;
        }, 0);
}

export function calculateEmergencyFundMonths(
    cashBalance: number,
    monthlyExpenses: number,
): number {
    if (monthlyExpenses <= 0) return Infinity;
    return cashBalance / monthlyExpenses;
}

export function groupTransactionsByMonth(
    transactions: TransactionLike[],
): Record<string, TransactionLike[]> {
    const grouped: Record<string, TransactionLike[]> = {};
    for (const tx of transactions) {
        const key = (tx.date || tx.occurredOn || '').slice(0, 7);
        if (!key) continue;
        (grouped[key] ??= []).push(tx);
    }
    return grouped;
}

export function topSpendingCategory(
    transactions: TransactionLike[],
): { category: string; total: number } | null {
    const cats = categorizeSpending(transactions);
    return cats[0] ?? null;
}
