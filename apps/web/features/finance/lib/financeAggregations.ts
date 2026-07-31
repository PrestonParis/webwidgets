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

export function calculateCashRunwayDays(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): number {
    const cash = accounts
        .filter((a) => CASH_TYPES.has(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const monthlyBurn =
        overview.monthlyExpenses + overview.monthlySubscriptionCost;
    if (monthlyBurn <= 0) return cash > 0 ? 999 : 0;
    return Math.max(0, Math.round((cash / monthlyBurn) * 30));
}

export function getSubscriptionBurdenPct(
    accounts: FinanceAccount[],
    subscriptions: FinanceSubscription[],
): number {
    const cash = accounts
        .filter((a) => CASH_TYPES.has(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const monthlySubs = subscriptions.reduce(
        (s, sub) => s + toMonthlySubscriptionAmount(sub),
        0,
    );
    if (cash <= 0 || monthlySubs <= 0) return 0;
    return Math.round((monthlySubs / cash) * 100);
}

export function getLargestAssetAccount(
    accounts: FinanceAccount[],
): { account: FinanceAccount; pct: number } | null {
    const assets = accounts.filter(
        (a) => ASSET_TYPES.has(a.type) && a.balance > 0,
    );
    if (assets.length === 0) return null;
    const total = assets.reduce((s, a) => s + a.balance, 0);
    const largest = [...assets].sort((a, b) => b.balance - a.balance)[0]!;
    return {
        account: largest,
        pct: total > 0 ? Math.round((largest.balance / total) * 100) : 0,
    };
}

export function calculateSavingsRate(
    transactions: FinanceTransaction[],
): number {
    const thisMonth = filterToCurrentMonth(transactions);
    const income = thisMonth
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const spending = thisMonth
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    if (income <= 0) return 0;
    return Math.max(0, Math.round(((income - spending) / income) * 100));
}

export function calculateBurnBreakdown(
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): { fixed: number; variable: number; total: number } {
    const thisMonth = filterToCurrentMonth(transactions);
    const variable = thisMonth
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const fixed = subscriptions.reduce(
        (s, sub) => s + toMonthlySubscriptionAmount(sub),
        0,
    );
    return {
        fixed: Math.round(fixed),
        variable: Math.round(variable),
        total: Math.round(fixed + variable),
    };
}

export function calculateNetWorthChangeDelta(
    transactions: FinanceTransaction[],
    days: number,
): number {
    const recent = filterToLastNDays(transactions, days);
    const income = recent
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const expenses = recent
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    return income - expenses;
}

export function calculateSpendingVelocity(transactions: FinanceTransaction[]): {
    pct: number;
    daysAfterIncome: number;
} {
    const thisMonth = filterToCurrentMonth(transactions);
    const income = thisMonth.filter(
        (tx) => tx.type === 'income' || tx.amount > 0,
    );
    const totalIncome = income.reduce((s, tx) => s + Math.abs(tx.amount), 0);
    if (totalIncome <= 0) return { pct: 0, daysAfterIncome: 3 };
    const firstIncome = [...income].sort((a, b) =>
        (a.date || a.occurredOn).localeCompare(b.date || b.occurredOn),
    )[0];
    if (!firstIncome) return { pct: 0, daysAfterIncome: 3 };
    const incomeDateStr = firstIncome.date || firstIncome.occurredOn;
    const cutoff = new Date(incomeDateStr + 'T00:00:00');
    cutoff.setDate(cutoff.getDate() + 3);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const spentQuickly = thisMonth
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .filter((tx) => {
            const d = tx.date || tx.occurredOn;
            return d >= incomeDateStr && d <= cutoffStr;
        })
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    return {
        pct: Math.round((spentQuickly / totalIncome) * 100),
        daysAfterIncome: 3,
    };
}

const ESSENTIAL_CATEGORIES = new Set([
    'Housing',
    'Utilities',
    'Groceries',
    'Transportation',
    'Healthcare',
    'Insurance',
    'Debt payments',
    'Rent',
    'Mortgage',
    'Gas',
    'Electric',
]);

export function getEssentialVsDiscretionary(
    transactions: FinanceTransaction[],
): {
    essential: number;
    discretionary: number;
    essentialPct: number;
    discretionaryPct: number;
} {
    const expenses = transactions.filter(
        (tx) => tx.type === 'expense' || tx.amount < 0,
    );
    const essential = expenses
        .filter((tx) => ESSENTIAL_CATEGORIES.has(tx.category))
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const discretionary = expenses
        .filter((tx) => !ESSENTIAL_CATEGORIES.has(tx.category))
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const total = essential + discretionary;
    return {
        essential,
        discretionary,
        essentialPct: total > 0 ? Math.round((essential / total) * 100) : 0,
        discretionaryPct:
            total > 0 ? Math.round((discretionary / total) * 100) : 0,
    };
}

export function detectImpulseClusters(
    transactions: FinanceTransaction[],
): Array<{ date: string; count: number; total: number }> {
    const expenses = transactions.filter(
        (tx) => tx.type === 'expense' || tx.amount < 0,
    );
    const byDate = new Map<string, FinanceTransaction[]>();
    for (const tx of expenses) {
        const d = tx.date || tx.occurredOn;
        byDate.set(d, [...(byDate.get(d) ?? []), tx]);
    }
    return [...byDate.entries()]
        .filter(([, txs]) => txs.length >= 3)
        .map(([date, txs]) => ({
            date,
            count: txs.length,
            total: txs.reduce((s, tx) => s + Math.abs(tx.amount), 0),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
}

export function getMerchantBreakdown(
    transactions: FinanceTransaction[],
): Array<{ merchant: string; count: number; total: number; category: string }> {
    const map = new Map<
        string,
        { count: number; total: number; category: string }
    >();
    for (const tx of transactions) {
        if (tx.type === 'income' || tx.amount > 0) continue;
        const key = (tx.merchant ?? tx.title ?? 'Unknown').trim();
        const existing = map.get(key);
        if (existing) {
            existing.count++;
            existing.total += Math.abs(tx.amount);
        } else {
            map.set(key, {
                count: 1,
                total: Math.abs(tx.amount),
                category: tx.category,
            });
        }
    }
    return [...map.entries()]
        .map(([merchant, d]) => ({ merchant, ...d }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
}

export function projectCashflow7Day(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): Array<{
    date: string;
    balance: number;
    label: string;
    event: { name: string; amount: number } | null;
}> {
    const cash = accounts
        .filter((a) => CASH_TYPES.has(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const last30 = filterToLastNDays(transactions, 30);
    const totalSpend = last30
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const dailyBurn = totalSpend / 30;
    const today = new Date();
    let running = cash;
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const dueSub = subscriptions.find(
            (s) =>
                s.active &&
                (s.nextBillingDate === dateStr || s.nextChargeOn === dateStr),
        );
        if (dueSub) running -= dueSub.amount;
        running -= dailyBurn;
        const dayLabel =
            i === 0
                ? 'Today'
                : i === 1
                  ? 'Tomorrow'
                  : d.toLocaleDateString('en-US', { weekday: 'short' });
        return {
            date: dateStr,
            balance: Math.round(running),
            label: dayLabel,
            event: dueSub ? { name: dueSub.name, amount: dueSub.amount } : null,
        };
    });
}

export function getSubscriptionIntelligence(
    subscriptions: FinanceSubscription[],
): {
    monthlyTotal: number;
    annualTotal: number;
    categoryGroups: Record<string, FinanceSubscription[]>;
    potentialOverlaps: FinanceSubscription[][];
} {
    const active = subscriptions.filter((s) => s.active);
    const monthlyTotal = active.reduce(
        (s, sub) => s + toMonthlySubscriptionAmount(sub),
        0,
    );
    const categoryGroups: Record<string, FinanceSubscription[]> = {};
    for (const sub of active) {
        const cat = sub.category || 'Other';
        categoryGroups[cat] = [...(categoryGroups[cat] ?? []), sub];
    }
    const potentialOverlaps = Object.values(categoryGroups).filter(
        (g) => g.length > 1,
    );
    return {
        monthlyTotal,
        annualTotal: monthlyTotal * 12,
        categoryGroups,
        potentialOverlaps,
    };
}

export function getFinanceTimeline(
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): Array<{
    date: string;
    label: string;
    amount: number;
    kind: 'income' | 'expense' | 'subscription' | 'transfer';
}> {
    const events: Array<{
        date: string;
        label: string;
        amount: number;
        kind: 'income' | 'expense' | 'subscription' | 'transfer';
    }> = [];
    for (const tx of transactions) {
        events.push({
            date: tx.date || tx.occurredOn,
            label: tx.merchant ?? tx.title,
            amount: tx.amount,
            kind:
                tx.type === 'income'
                    ? 'income'
                    : tx.type === 'transfer'
                      ? 'transfer'
                      : 'expense',
        });
    }
    const today = new Date().toISOString().slice(0, 10);
    for (const sub of subscriptions) {
        const chargeDate = sub.nextBillingDate ?? sub.nextChargeOn;
        if (sub.active && chargeDate && chargeDate <= today) {
            events.push({
                date: chargeDate,
                label: sub.name,
                amount: -sub.amount,
                kind: 'subscription',
            });
        }
    }
    return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
}
