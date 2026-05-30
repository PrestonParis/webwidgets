'use client';

import {
    calculateNetWorth,
    calculateFinanceOverview,
    calculateCashRunwayDays,
    getSubscriptionBurdenPct,
    getLargestAssetAccount,
} from '@/features/finance/lib/financeAggregations';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface NetWorthSummaryProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    formatAmount?: (
        value: number,
        currency?: string,
        maximumFractionDigits?: number,
    ) => string;
    amountClassName?: string;
}

export function NetWorthSummary({
    accounts,
    transactions,
    subscriptions,
    formatAmount,
    amountClassName = '',
}: NetWorthSummaryProps) {
    const fmt =
        formatAmount ??
        ((n: number, _currency = 'USD', fractions = 2) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: fractions,
            }));

    const netWorth = calculateNetWorth(accounts);
    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const runway = calculateCashRunwayDays(
        accounts,
        transactions,
        subscriptions,
    );
    const subBurden = getSubscriptionBurdenPct(accounts, subscriptions);
    const largestAsset = getLargestAssetAccount(accounts);

    const cashflowSign = overview.netMonthlyCashflow >= 0 ? '+' : '';
    const cashflowColor =
        overview.netMonthlyCashflow >= 0 ? 'text-emerald-400' : 'text-red-400';
    const hasData = accounts.length > 0;

    const stats = [
        {
            label: 'Assets',
            value: fmt(overview.totalAssets),
            color: 'text-emerald-400',
        },
        {
            label: 'Liabilities',
            value: fmt(overview.totalLiabilities),
            color:
                overview.totalLiabilities > 0
                    ? 'text-red-400'
                    : 'text-gray-500 dark:text-zinc-500',
        },
        {
            label: 'Cash',
            value: fmt(overview.cashTotal),
            color: 'text-cyan-400',
        },
        {
            label: 'Investments',
            value: fmt(
                accounts
                    .filter((a) => a.type === 'investment')
                    .reduce((s, a) => s + a.balance, 0),
            ),
            color: 'text-blue-400',
        },
        {
            label: 'Monthly burn',
            value: fmt(
                overview.monthlyExpenses + overview.monthlySubscriptionCost,
            ),
            color: 'text-orange-400',
        },
        {
            label: 'Subscriptions/mo',
            value: fmt(overview.monthlySubscriptionCost),
            color: 'text-purple-400',
        },
    ];

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Hero row */}
            <div className="px-5 pt-5 pb-4 flex flex-wrap items-start gap-4 justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                        Net Worth
                    </p>
                    <p
                        className={`text-4xl font-bold tabular-nums ${amountClassName} ${netWorth >= 0 ? 'text-gray-900 dark:text-zinc-100' : 'text-red-500'}`}
                    >
                        {fmt(netWorth)}
                    </p>
                    {hasData && overview.netMonthlyCashflow !== 0 && (
                        <p
                            className={`text-sm mt-1 font-medium ${cashflowColor}`}
                        >
                            {cashflowSign}
                            {fmt(overview.netMonthlyCashflow)} net this month
                        </p>
                    )}
                </div>

                {/* Signal strip */}
                {hasData && (
                    <div className="flex flex-col gap-1.5 text-right text-xs">
                        {runway < 999 && (
                            <div
                                className={`font-medium ${runway < 30 ? 'text-red-400' : runway < 90 ? 'text-amber-400' : 'text-emerald-400'}`}
                            >
                                {runway}d cash runway
                            </div>
                        )}
                        {subBurden > 0 && (
                            <div
                                className={`font-medium ${subBurden > 30 ? 'text-red-400' : subBurden > 15 ? 'text-amber-400' : 'text-emerald-400'}`}
                            >
                                {subBurden}% sub burden
                            </div>
                        )}
                        {largestAsset && (
                            <div className="text-gray-400 dark:text-zinc-500">
                                {largestAsset.account.name} · {largestAsset.pct}
                                % of assets
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats grid */}
            {hasData && (
                <div className="border-t border-gray-100 dark:border-zinc-800 grid grid-cols-3 md:grid-cols-6">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.label}
                            className={`px-4 py-3 ${i < stats.length - 1 ? 'border-r border-gray-100 dark:border-zinc-800' : ''}`}
                        >
                            <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-0.5 whitespace-nowrap">
                                {stat.label}
                            </p>
                            <p
                                className={`text-sm font-semibold tabular-nums ${amountClassName} ${stat.color}`}
                            >
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!hasData && (
                <div className="border-t border-gray-100 dark:border-zinc-800 px-5 py-4">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        Add your first account to see your financial position.
                    </p>
                </div>
            )}
        </div>
    );
}
