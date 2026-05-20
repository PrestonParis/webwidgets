import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

export type FinancePrediction = {
    label: string;
    confidence: number;
    reason: string;
};

export type FinanceActionSuggestion = FinancePrediction & {
    actionType:
        | 'review_subscriptions'
        | 'categorize_transaction'
        | 'reduce_debt'
        | 'build_cash_buffer'
        | 'inspect_recurring';
};

export function predictCashflowRisk(
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): FinancePrediction {
    const monthlyIncome = transactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const monthlyExpenses = transactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const subscriptionsMonthly = subscriptions.reduce(
        (sum, sub) => sum + toMonthlyAmount(sub),
        0,
    );
    const projected = monthlyIncome - monthlyExpenses - subscriptionsMonthly;

    if (projected < 0) {
        return {
            label: 'Cashflow risk',
            confidence: 0.78,
            reason: `Projected monthly cashflow is ${projected.toFixed(0)} after known subscriptions.`,
        };
    }

    return {
        label: 'Cashflow stable',
        confidence: 0.64,
        reason: `Projected monthly cashflow is positive based on current transactions and subscriptions.`,
    };
}

export function detectRecurringTransactions(
    transactions: FinanceTransaction[],
): FinancePrediction[] {
    const groups = new Map<string, FinanceTransaction[]>();
    for (const tx of transactions) {
        const key = `${tx.title.toLowerCase()}-${Math.round(Math.abs(tx.amount))}`;
        groups.set(key, [...(groups.get(key) ?? []), tx]);
    }

    return [...groups.values()]
        .filter((group) => group.length >= 2)
        .map((group) => ({
            label: 'Recurring transaction candidate',
            confidence: Math.min(0.9, 0.55 + group.length * 0.1),
            reason: `${group[0]?.title ?? 'A transaction'} appears ${group.length} times at a similar amount.`,
        }));
}

export function suggestTransactionCategory(title: string): FinancePrediction {
    const normalized = title.toLowerCase();
    const rules: Array<[RegExp, string]> = [
        [/uber|lyft|gas|shell|chevron/, 'Transportation'],
        [/netflix|spotify|hulu|apple|youtube/, 'Subscriptions'],
        [/whole foods|trader joe|grocery|market/, 'Groceries'],
        [/payroll|salary|stripe|deposit/, 'Income'],
        [/rent|mortgage/, 'Housing'],
    ];
    const match = rules.find(([pattern]) => pattern.test(normalized));

    if (!match)
        return {
            label: 'Uncategorized',
            confidence: 0.35,
            reason: 'No deterministic category rule matched this title.',
        };
    return {
        label: match[1],
        confidence: 0.72,
        reason: `Matched a deterministic keyword rule for ${match[1]}.`,
    };
}

export function generateFinanceInsights(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): FinancePrediction[] {
    const assets = accounts
        .filter((account) => account.balance > 0)
        .reduce((sum, account) => sum + account.balance, 0);
    const liabilities = accounts
        .filter(
            (account) =>
                account.balance < 0 ||
                ['credit', 'loan'].includes(account.type),
        )
        .reduce((sum, account) => sum + Math.abs(account.balance), 0);
    const subscriptionTotal = subscriptions.reduce(
        (sum, sub) => sum + toMonthlyAmount(sub),
        0,
    );
    const risk = predictCashflowRisk(transactions, subscriptions);

    return [
        {
            label: 'Monthly subscriptions',
            confidence: 1,
            reason: `Known active subscriptions total ${subscriptionTotal.toFixed(0)} per month.`,
        },
        risk,
        {
            label: 'Liability ratio',
            confidence: 1,
            reason:
                assets > 0
                    ? `Liabilities are ${((liabilities / assets) * 100).toFixed(0)}% of assets.`
                    : 'Assets are not recorded yet.',
        },
        ...detectRecurringTransactions(transactions).slice(0, 2),
    ];
}

export function suggestFinanceActions(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): FinanceActionSuggestion[] {
    const suggestions: FinanceActionSuggestion[] = [];
    const cash = accounts
        .filter((account) =>
            ['cash', 'checking', 'savings'].includes(account.type),
        )
        .reduce((sum, account) => sum + account.balance, 0);
    const debt = accounts
        .filter((account) => ['credit', 'loan'].includes(account.type))
        .reduce((sum, account) => sum + Math.abs(account.balance), 0);

    if (subscriptions.length > 0)
        suggestions.push({
            actionType: 'review_subscriptions',
            label: 'Review subscriptions',
            confidence: 0.74,
            reason: 'Active recurring costs are available to audit.',
        });
    if (debt > 0)
        suggestions.push({
            actionType: 'reduce_debt',
            label: 'Prioritize debt payoff',
            confidence: 0.68,
            reason: `Recorded liabilities total ${debt.toFixed(0)}.`,
        });
    if (cash < 1000)
        suggestions.push({
            actionType: 'build_cash_buffer',
            label: 'Build cash buffer',
            confidence: 0.62,
            reason: 'Cash accounts are below the starter buffer threshold.',
        });
    if (detectRecurringTransactions(transactions).length > 0)
        suggestions.push({
            actionType: 'inspect_recurring',
            label: 'Inspect recurring transactions',
            confidence: 0.7,
            reason: 'Similar transactions appear multiple times.',
        });

    return suggestions;
}

function toMonthlyAmount(subscription: FinanceSubscription) {
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
    if (
        subscription.billingCycle === 'custom' ||
        subscription.cadence === 'custom'
    )
        return subscription.amount;
    return subscription.amount;
}
