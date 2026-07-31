'use client';

import {
    filterToCurrentMonth,
    getCategoryBreakdown,
    getEssentialVsDiscretionary,
    detectImpulseClusters,
    getMerchantBreakdown,
    calculateSpendingVelocity,
} from '@/features/finance/lib/financeAggregations';
import type { FinanceTransaction } from '@/features/finance/types/finance';

interface SpendingAnalysisProps {
    transactions: FinanceTransaction[];
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
}

export function SpendingAnalysis({
    transactions,
    formatAmount,
    amountClassName,
}: SpendingAnalysisProps) {
    const thisMonth = filterToCurrentMonth(transactions);
    const breakdown = getCategoryBreakdown(thisMonth);
    const split = getEssentialVsDiscretionary(thisMonth);
    const impulse = detectImpulseClusters(thisMonth);
    const merchants = getMerchantBreakdown(transactions);
    const velocity = calculateSpendingVelocity(transactions);

    const hasData = transactions.length > 0;
    const maxCat = breakdown[0]?.amount ?? 1;

    if (!hasData) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                    Spending Analysis
                </p>
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                    Add transactions to unlock spending analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Essential vs Discretionary */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                    Essential vs Discretionary
                </p>
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden flex">
                        <div
                            className="h-full bg-cyan-500/60 transition-all"
                            style={{ width: `${split.essentialPct}%` }}
                        />
                        <div
                            className="h-full bg-orange-400/60 transition-all"
                            style={{ width: `${split.discretionaryPct}%` }}
                        />
                    </div>
                </div>
                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500/60" />
                        <span className="text-gray-600 dark:text-zinc-400">
                            Essential{' '}
                            <span className="font-semibold text-cyan-500">
                                {split.essentialPct}%
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400/60" />
                        <span className="text-gray-600 dark:text-zinc-400">
                            Discretionary{' '}
                            <span className="font-semibold text-orange-400">
                                {split.discretionaryPct}%
                            </span>
                        </span>
                    </div>
                </div>
                {split.discretionaryPct > 50 && (
                    <p className="text-[11px] text-amber-400 mt-2">
                        Over half your spending is discretionary this month.
                    </p>
                )}
            </div>

            {/* Category breakdown */}
            {breakdown.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        This Month by Category
                    </p>
                    <div className="space-y-2">
                        {breakdown.slice(0, 7).map(({ category, amount }) => (
                            <div
                                key={category}
                                className="flex items-center gap-3"
                            >
                                <span className="text-xs text-gray-600 dark:text-zinc-300 w-28 shrink-0 truncate">
                                    {category}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-orange-400/60 transition-all"
                                        style={{
                                            width: `${(amount / maxCat) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span
                                    className={`text-xs font-medium text-gray-700 dark:text-zinc-300 w-20 text-right shrink-0 tabular-nums ${amountClassName ?? ''}`}
                                >
                                    {formatAmount(amount, 'USD', 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spending velocity + impulse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {velocity.pct > 0 && (
                    <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                            Spending Velocity
                        </p>
                        <p
                            className={`text-2xl font-bold ${velocity.pct > 60 ? 'text-red-400' : velocity.pct > 30 ? 'text-amber-400' : 'text-emerald-400'}`}
                        >
                            {velocity.pct}%
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                            of paycheck spent within {velocity.daysAfterIncome}{' '}
                            days of income
                        </p>
                    </div>
                )}
                {impulse.length > 0 && (
                    <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                            Impulse Clusters
                        </p>
                        <div className="space-y-1.5">
                            {impulse.map((c) => (
                                <div
                                    key={c.date}
                                    className="flex justify-between text-xs"
                                >
                                    <span className="text-gray-500 dark:text-zinc-400">
                                        {new Date(
                                            c.date + 'T00:00:00',
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}{' '}
                                        <span className="text-orange-400">
                                            {c.count} purchases
                                        </span>
                                    </span>
                                    <span
                                        className={`font-semibold tabular-nums ${amountClassName ?? ''} text-orange-400`}
                                    >
                                        {formatAmount(c.total, 'USD', 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Merchant intelligence */}
            {merchants.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        Top Merchants
                    </p>
                    <div className="space-y-1.5">
                        {merchants.slice(0, 8).map((m) => (
                            <div
                                key={m.merchant}
                                className="flex items-center justify-between text-sm py-1 border-b border-gray-50 dark:border-zinc-800/60 last:border-0"
                            >
                                <div className="min-w-0">
                                    <span className="text-gray-700 dark:text-zinc-300 truncate block">
                                        {m.merchant}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {m.category} · {m.count}{' '}
                                        {m.count === 1
                                            ? 'purchase'
                                            : 'purchases'}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 ml-3 font-semibold tabular-nums ${amountClassName ?? ''} text-gray-700 dark:text-zinc-300`}
                                >
                                    {formatAmount(m.total, 'USD', 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
