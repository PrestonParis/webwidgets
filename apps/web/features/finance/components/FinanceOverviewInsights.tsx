'use client';

import { calculateFinanceOverview } from '@/features/finance/lib/financeAggregations';
import {
    generateFinanceInsights,
    suggestFinanceActions,
} from '@/features/finance/lib/financePredictions';
import { CashflowAreaChart } from '@/features/finance/components/charts/CashflowAreaChart';
import { SpendingTreemap } from '@/features/finance/components/charts/SpendingTreemap';
import { FinancialHealthRadar } from '@/features/finance/components/charts/FinancialHealthRadar';
import { SubscriptionTimeline } from '@/features/finance/components/charts/SubscriptionTimeline';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface FinanceOverviewInsightsProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    formatAmount?: (
        value: number,
        currency?: string,
        maximumFractionDigits?: number,
    ) => string;
    amountClassName?: string;
    onSeeAllTransactions?: () => void;
    onSeeAllSubscriptions?: () => void;
}

export function FinanceOverviewInsights({
    accounts,
    transactions,
    subscriptions,
    formatAmount,
    amountClassName = '',
    onSeeAllTransactions,
    onSeeAllSubscriptions,
}: FinanceOverviewInsightsProps) {
    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const insights = generateFinanceInsights(
        accounts,
        transactions,
        subscriptions,
    );
    const actions = suggestFinanceActions(
        accounts,
        transactions,
        subscriptions,
    );
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));
    const fmtSimple = (n: number) =>
        n.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        });
    const liabilityRatio =
        overview.totalAssets > 0
            ? `${((overview.totalLiabilities / overview.totalAssets) * 100).toFixed(0)}%`
            : '0%';
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });

    const cards = [
        {
            label: 'Cash',
            value: fmt(overview.cashTotal),
            tone: 'text-emerald-400',
        },
        { label: 'Debt', value: fmt(overview.debtTotal), tone: 'text-red-400' },
        {
            label: `${monthLabel} income`,
            value: fmt(overview.monthlyIncome),
            tone: 'text-green-400',
        },
        {
            label: `${monthLabel} spend`,
            value: fmt(overview.monthlyExpenses),
            tone: 'text-orange-300',
        },
        {
            label: 'Net cashflow',
            value: fmt(overview.netMonthlyCashflow),
            tone:
                overview.netMonthlyCashflow >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400',
        },
        {
            label: 'Liability ratio',
            value: liabilityRatio,
            tone: 'text-zinc-100',
        },
    ];

    return (
        <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                    >
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            {card.label}
                        </p>
                        <p
                            className={`text-lg font-semibold mt-1 ${amountClassName} ${card.tone}`}
                        >
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Cashflow chart */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                    Cashflow — last 6 months
                </p>
                <CashflowAreaChart
                    transactions={transactions}
                    formatAmount={fmtSimple}
                />
            </div>

            {/* Spending treemap + financial health */}
            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        Spending — {monthLabel}
                    </p>
                    <SpendingTreemap
                        breakdown={overview.categoryBreakdown}
                        formatAmount={fmtSimple}
                        amountClassName={amountClassName}
                    />
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                        Financial health
                    </p>
                    <FinancialHealthRadar
                        accounts={accounts}
                        transactions={transactions}
                        subscriptions={subscriptions}
                    />
                </div>
            </div>

            {/* Insights + suggested actions */}
            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Insights
                    </p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        You have{' '}
                        <span className={amountClassName}>
                            {fmt(overview.monthlySubscriptionCost)}
                        </span>{' '}
                        in monthly subscriptions.
                    </p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        Projected monthly cashflow is{' '}
                        <span
                            className={`font-medium ${overview.netMonthlyCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'} ${amountClassName}`}
                        >
                            {fmt(overview.netMonthlyCashflow)}
                        </span>
                        .
                    </p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        Largest spend in {monthLabel}:{' '}
                        {overview.topSpendingCategory ? (
                            <>
                                <span className="font-medium text-gray-900 dark:text-zinc-100">
                                    {overview.topSpendingCategory.category}
                                </span>{' '}
                                (
                                <span className={amountClassName}>
                                    {fmt(overview.topSpendingCategory.amount)}
                                </span>
                                )
                            </>
                        ) : (
                            <span className="text-gray-400 dark:text-zinc-500">
                                none yet
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        Liabilities are {liabilityRatio} of assets.
                    </p>
                    {insights.slice(0, 2).map((insight) => (
                        <p
                            key={insight.label}
                            className="text-xs text-gray-400 dark:text-zinc-500 italic"
                        >
                            {insight.reason}
                        </p>
                    ))}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Suggested actions
                    </p>
                    {actions.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-zinc-500">
                            Add more data to surface deterministic action
                            suggestions.
                        </p>
                    ) : (
                        actions.slice(0, 4).map((action) => (
                            <div
                                key={action.actionType}
                                className="flex items-start justify-between gap-3 text-sm"
                            >
                                <p className="text-gray-700 dark:text-zinc-300">
                                    {action.label}
                                </p>
                                <span className="text-[10px] text-emerald-400 shrink-0">
                                    {Math.round(action.confidence * 100)}%
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Subscription timeline */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Subscription billing calendar
                    </p>
                    {onSeeAllSubscriptions && subscriptions.length > 0 && (
                        <button
                            onClick={onSeeAllSubscriptions}
                            className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            Manage
                        </button>
                    )}
                </div>
                <SubscriptionTimeline
                    subscriptions={subscriptions}
                    formatAmount={fmtSimple}
                    amountClassName={amountClassName}
                />
            </div>

            {/* Recent transactions */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Recent transactions
                    </p>
                    {onSeeAllTransactions && transactions.length > 0 && (
                        <button
                            onClick={onSeeAllTransactions}
                            className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            See all
                        </button>
                    )}
                </div>
                {overview.recentTransactions.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        No transactions yet
                    </p>
                ) : (
                    overview.recentTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0"
                        >
                            <div className="min-w-0">
                                <span className="text-gray-700 dark:text-zinc-300 truncate block">
                                    {tx.title}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    {tx.date || tx.occurredOn} · {tx.category}
                                </span>
                            </div>
                            <span
                                className={`shrink-0 ml-3 font-medium ${amountClassName} ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}
                            >
                                {fmt(tx.amount)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
