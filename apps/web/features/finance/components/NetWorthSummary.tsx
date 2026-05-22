'use client';

import { calculateNetWorth } from '@/features/finance/lib/financeAggregations';
import type { FinanceAccount } from '@/features/finance/types/finance';

const TYPE_LABEL: Record<string, string> = {
    cash: 'Cash',
    checking: 'Checking',
    savings: 'Savings',
    investment: 'Investments',
    credit: 'Credit',
    loan: 'Loans',
    other: 'Other',
};

const ASSET_TYPES = ['cash', 'checking', 'savings', 'investment', 'other'];
const LIABILITY_TYPES = ['credit', 'loan'];

interface NetWorthSummaryProps {
    accounts: FinanceAccount[];
    formatAmount?: (
        value: number,
        currency?: string,
        maximumFractionDigits?: number,
    ) => string;
    amountClassName?: string;
}

export function NetWorthSummary({
    accounts,
    formatAmount,
    amountClassName = '',
}: NetWorthSummaryProps) {
    const netWorth = calculateNetWorth(accounts);
    const assets = accounts
        .filter((a) => ASSET_TYPES.includes(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts
        .filter((a) => LIABILITY_TYPES.includes(a.type))
        .reduce((s, a) => s + Math.abs(a.balance), 0);
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));

    return (
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4">
            <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Net Worth
                </p>
                <p
                    className={`text-3xl font-bold ${amountClassName} ${netWorth >= 0 ? 'text-gray-900 dark:text-zinc-100' : 'text-red-500'}`}
                >
                    {fmt(netWorth)}
                </p>
            </div>
            <div className="flex gap-6">
                <div>
                    <p className="text-xs text-green-500 font-medium">Assets</p>
                    <p
                        className={`text-lg font-semibold text-gray-800 dark:text-zinc-200 ${amountClassName}`}
                    >
                        {fmt(assets)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-red-400 font-medium">
                        Liabilities
                    </p>
                    <p
                        className={`text-lg font-semibold text-gray-800 dark:text-zinc-200 ${amountClassName}`}
                    >
                        {fmt(liabilities)}
                    </p>
                </div>
            </div>
            {accounts.length > 0 && (
                <div className="space-y-1.5">
                    {(
                        [
                            'cash',
                            'checking',
                            'savings',
                            'investment',
                            'credit',
                            'loan',
                            'other',
                        ] as const
                    ).map((type) => {
                        const group = accounts.filter((a) => a.type === type);
                        if (group.length === 0) return null;
                        const total = group.reduce((s, a) => s + a.balance, 0);
                        return (
                            <div
                                key={type}
                                className="flex justify-between items-center text-xs"
                            >
                                <span className="text-gray-500 dark:text-zinc-400">
                                    {TYPE_LABEL[type]}
                                </span>
                                <span
                                    className={`font-medium ${amountClassName} ${LIABILITY_TYPES.includes(type) ? 'text-red-400' : 'text-gray-700 dark:text-zinc-300'}`}
                                >
                                    {fmt(total)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
