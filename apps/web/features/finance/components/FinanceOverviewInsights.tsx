'use client';

import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Bell,
    BarChart3,
    CheckCircle2,
    Circle,
    TrendingUp,
} from 'lucide-react';
import { calculateFinanceOverview } from '@/features/finance/lib/financeAggregations';
import { suggestFinanceActions } from '@/features/finance/lib/financePredictions';
import { CashflowAreaChart } from '@/features/ui/visualizations/components/CashflowAreaChart';
import { FinancialHealthScore } from '@/features/finance/components/FinancialHealthScore';
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
    onAddAccount?: () => void;
    onAddTransaction?: () => void;
    onAddSubscription?: () => void;
}

// Days until a date string (YYYY-MM-DD)
function daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function groupLabel(days: number): string {
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return 'This week';
    if (days <= 31) return 'This month';
    return 'Later';
}

const GROUP_ORDER = [
    'Overdue',
    'Today',
    'Tomorrow',
    'This week',
    'This month',
    'Later',
];

export function FinanceOverviewInsights({
    accounts,
    transactions,
    subscriptions,
    formatAmount,
    amountClassName = '',
    onSeeAllTransactions,
    onSeeAllSubscriptions,
    onAddAccount,
    onAddTransaction,
    onAddSubscription,
}: FinanceOverviewInsightsProps) {
    const overview = calculateFinanceOverview(
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

    const hasAccounts = accounts.length > 0;
    const hasTransactions = transactions.length > 0;
    const hasSubscriptions = subscriptions.length > 0;
    const isEmpty = !hasAccounts && !hasTransactions && !hasSubscriptions;

    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', { month: 'long' });

    // Build upcoming subscription timeline
    const upcomingSubs = subscriptions
        .filter((s) => s.active && (s.nextBillingDate || s.nextChargeOn))
        .map((s) => {
            const dateStr = (s.nextBillingDate || s.nextChargeOn)!;
            const days = daysUntil(dateStr);
            return { sub: s, days, dateStr };
        })
        .filter((item) => item.days <= 31)
        .sort((a, b) => a.days - b.days);

    const timelineGroups = upcomingSubs.reduce<
        Record<string, typeof upcomingSubs>
    >((acc, item) => {
        const group = groupLabel(item.days);
        acc[group] = [...(acc[group] ?? []), item];
        return acc;
    }, {});

    // Build contextual insights
    const coachInsights: string[] = [];
    if (overview.netMonthlyCashflow < 0)
        coachInsights.push(
            `You are spending more than you earn. Negative cashflow of ${fmt(Math.abs(overview.netMonthlyCashflow))}/mo.`,
        );
    if (overview.monthlySubscriptionCost > 0 && overview.cashTotal > 0) {
        const pct = Math.round(
            (overview.monthlySubscriptionCost / overview.cashTotal) * 100,
        );
        if (pct > 20)
            coachInsights.push(
                `Subscriptions consume ${pct}% of your available cash.`,
            );
    }
    if (
        overview.cashTotal < overview.monthlyExpenses &&
        overview.monthlyExpenses > 0
    )
        coachInsights.push(`You have less than 1 month of expenses in cash.`);
    if (overview.totalLiabilities === 0 && hasAccounts)
        coachInsights.push(`You have no recorded debt.`);
    if (accounts.some((a) => a.type === 'investment'))
        coachInsights.push(`You have active investment accounts.`);

    return (
        <div className="space-y-4">
            {/* ========== EMPTY STATE ONBOARDING ========== */}
            {isEmpty && (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 p-6">
                    <p className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                        Build your financial system
                    </p>
                    <p className="text-sm text-gray-500 dark:text-zinc-500 mb-5">
                        Add a few records to unlock cashflow forecasting,
                        spending analytics, and your financial health score.
                    </p>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                                Add
                            </p>
                            <div className="space-y-2">
                                {[
                                    {
                                        label: 'Account',
                                        desc: 'Track balances and net worth',
                                        done: hasAccounts,
                                        action: onAddAccount,
                                    },
                                    {
                                        label: 'Transaction',
                                        desc: 'Enable cashflow analysis',
                                        done: hasTransactions,
                                        action: onAddTransaction,
                                    },
                                    {
                                        label: 'Subscription',
                                        desc: 'Track recurring costs',
                                        done: hasSubscriptions,
                                        action: onAddSubscription,
                                    },
                                ].map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={item.action}
                                        disabled={item.done}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${item.done ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-default' : 'border-gray-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer'}`}
                                    >
                                        <span
                                            className={`shrink-0 ${item.done ? 'text-emerald-500' : 'text-gray-400 dark:text-zinc-600'}`}
                                        >
                                            {item.done ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <Circle size={16} />
                                            )}
                                        </span>
                                        <div>
                                            <p
                                                className={`text-sm font-medium ${item.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}
                                            >
                                                {item.label}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                                Unlock
                            </p>
                            <div className="space-y-1.5 text-sm text-gray-500 dark:text-zinc-500">
                                {(
                                    [
                                        {
                                            icon: <TrendingUp size={14} />,
                                            label: 'Cashflow forecasting',
                                            req: 'transactions',
                                        },
                                        {
                                            icon: <BarChart3 size={14} />,
                                            label: 'Spending analytics',
                                            req: 'transactions',
                                        },
                                        {
                                            icon: <Activity size={14} />,
                                            label: 'Financial health score',
                                            req: 'accounts',
                                        },
                                        {
                                            icon: <Bell size={14} />,
                                            label: 'Automated reminders',
                                            req: 'subscriptions',
                                        },
                                    ] as const
                                ).map((feature) => {
                                    const unlocked =
                                        (feature.req === 'accounts' &&
                                            hasAccounts) ||
                                        (feature.req === 'transactions' &&
                                            hasTransactions) ||
                                        (feature.req === 'subscriptions' &&
                                            hasSubscriptions);
                                    return (
                                        <div
                                            key={feature.label}
                                            className="flex items-center gap-2"
                                        >
                                            <span
                                                className={
                                                    unlocked
                                                        ? 'text-emerald-500'
                                                        : 'text-gray-400 dark:text-zinc-600'
                                                }
                                            >
                                                {feature.icon}
                                            </span>
                                            <span
                                                className={
                                                    unlocked
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : ''
                                                }
                                            >
                                                {feature.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== COACH INSIGHTS ========== */}
            {coachInsights.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 font-bold">
                        Financial coach
                    </p>
                    {coachInsights.map((insight) => (
                        <div
                            key={insight}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300"
                        >
                            <ArrowRight
                                size={14}
                                className="text-amber-400 mt-0.5 shrink-0"
                            />
                            <span>{insight}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== QUICK STATS ========== */}
            {hasAccounts && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            label: `${monthLabel} income`,
                            value: fmt(overview.monthlyIncome),
                            tone:
                                overview.monthlyIncome > 0
                                    ? 'text-emerald-400'
                                    : 'text-gray-400 dark:text-zinc-500',
                        },
                        {
                            label: `${monthLabel} spend`,
                            value: fmt(overview.monthlyExpenses),
                            tone:
                                overview.monthlyExpenses > 0
                                    ? 'text-orange-400'
                                    : 'text-gray-400 dark:text-zinc-500',
                        },
                        {
                            label: 'Net cashflow',
                            value:
                                (overview.netMonthlyCashflow >= 0 ? '+' : '') +
                                fmt(overview.netMonthlyCashflow),
                            tone:
                                overview.netMonthlyCashflow >= 0
                                    ? 'text-emerald-400'
                                    : 'text-red-400',
                        },
                        {
                            label: 'Liability ratio',
                            value:
                                overview.totalAssets > 0
                                    ? `${((overview.totalLiabilities / overview.totalAssets) * 100).toFixed(0)}%`
                                    : '0%',
                            tone: 'text-zinc-400 dark:text-zinc-400',
                        },
                    ].map((card) => (
                        <div
                            key={card.label}
                            className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                        >
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                {card.label}
                            </p>
                            <p
                                className={`text-lg font-semibold mt-1 tabular-nums ${amountClassName} ${card.tone}`}
                            >
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ========== CASHFLOW CHART ========== */}
            {hasTransactions && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        Cashflow (last 6 months)
                    </p>
                    <CashflowAreaChart
                        transactions={transactions}
                        formatAmount={fmtSimple}
                    />
                </div>
            )}

            {/* ========== FINANCIAL HEALTH SCORE ========== */}
            {hasAccounts && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4">
                        Financial health
                    </p>
                    <FinancialHealthScore
                        accounts={accounts}
                        transactions={transactions}
                        subscriptions={subscriptions}
                    />
                </div>
            )}

            {/* ========== UPCOMING FINANCIAL TIMELINE ========== */}
            {upcomingSubs.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Upcoming
                        </p>
                        {onSeeAllSubscriptions && (
                            <button
                                onClick={onSeeAllSubscriptions}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                Manage
                            </button>
                        )}
                    </div>
                    <div className="space-y-3">
                        {GROUP_ORDER.filter((g) => timelineGroups[g]).map(
                            (group) => (
                                <div key={group}>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1.5">
                                        {group}
                                    </p>
                                    <div className="space-y-1.5">
                                        {timelineGroups[group]!.map(
                                            ({ sub, days }) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${days <= 0 ? 'bg-red-400' : days <= 2 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                        />
                                                        <span className="text-gray-700 dark:text-zinc-300 truncate">
                                                            {sub.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                                        <span
                                                            className={`font-medium tabular-nums ${amountClassName} text-gray-600 dark:text-zinc-400`}
                                                        >
                                                            {fmt(sub.amount)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 w-16 text-right">
                                                            {days === 0
                                                                ? 'today'
                                                                : days === 1
                                                                  ? 'tomorrow'
                                                                  : days < 0
                                                                    ? `${Math.abs(days)}d overdue`
                                                                    : `in ${days}d`}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </div>
            )}

            {/* ========== SUBSCRIPTION INTELLIGENCE ========== */}
            {hasSubscriptions && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Subscriptions
                        </p>
                        {onSeeAllSubscriptions && (
                            <button
                                onClick={onSeeAllSubscriptions}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                See all
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {/* Monthly total */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                Monthly total
                            </p>
                            <p
                                className={`text-lg font-semibold text-purple-400 tabular-nums mt-0.5 ${amountClassName}`}
                            >
                                {fmt(overview.monthlySubscriptionCost)}
                            </p>
                        </div>
                        {/* Count */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                Active
                            </p>
                            <p className="text-lg font-semibold text-gray-700 dark:text-zinc-300 mt-0.5">
                                {subscriptions.filter((s) => s.active).length}
                            </p>
                        </div>
                        {/* Largest */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                Largest cost
                            </p>
                            {(() => {
                                const largest = [...subscriptions]
                                    .filter((s) => s.active)
                                    .sort((a, b) => b.amount - a.amount)[0];
                                return largest ? (
                                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mt-0.5 truncate">
                                        {largest.name}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
                                        N/A
                                    </p>
                                );
                            })()}
                        </div>
                        {/* Next renewal */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                Next renewal
                            </p>
                            {upcomingSubs[0] ? (
                                <div className="mt-0.5">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 truncate">
                                        {upcomingSubs[0].sub.name}
                                    </p>
                                    <p className="text-[10px] text-amber-400">
                                        {upcomingSubs[0].days === 0
                                            ? 'today'
                                            : upcomingSubs[0].days === 1
                                              ? 'tomorrow'
                                              : `in ${upcomingSubs[0].days}d`}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
                                    N/A
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Smart nudges */}
                    {overview.monthlySubscriptionCost > 0 &&
                        overview.cashTotal > 0 && (
                            <div className="text-xs text-gray-500 dark:text-zinc-500 border-t border-gray-100 dark:border-zinc-800 pt-3 space-y-1">
                                {Math.round(
                                    (overview.monthlySubscriptionCost /
                                        overview.cashTotal) *
                                        100,
                                ) > 15 && (
                                    <p className="flex items-start gap-1.5">
                                        <AlertTriangle
                                            size={12}
                                            className="text-amber-400 shrink-0 mt-0.5"
                                        />
                                        Subscriptions represent{' '}
                                        {Math.round(
                                            (overview.monthlySubscriptionCost /
                                                overview.cashTotal) *
                                                100,
                                        )}
                                        % of your available cash.
                                    </p>
                                )}
                                {subscriptions.filter(
                                    (s) =>
                                        s.active &&
                                        s.category
                                            ?.toLowerCase()
                                            .includes('ai'),
                                ).length >= 2 && (
                                    <p className="flex items-start gap-1.5">
                                        <ArrowRight
                                            size={12}
                                            className="text-amber-400 shrink-0 mt-0.5"
                                        />
                                        Review overlapping AI subscriptions for
                                        potential savings.
                                    </p>
                                )}
                            </div>
                        )}
                </div>
            )}

            {/* ========== SUGGESTED ACTIONS ========== */}
            {actions.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        Suggested actions
                    </p>
                    <div className="space-y-2">
                        {actions.slice(0, 4).map((action) => (
                            <div
                                key={action.actionType}
                                className="flex items-start gap-3 text-sm"
                            >
                                <ArrowRight
                                    size={14}
                                    className="text-emerald-400 mt-0.5 shrink-0"
                                />
                                <div>
                                    <p className="text-gray-700 dark:text-zinc-300 font-medium">
                                        {action.label}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                        {action.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========== RECENT TRANSACTIONS ========== */}
            {hasTransactions && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Recent transactions
                        </p>
                        {onSeeAllTransactions && (
                            <button
                                onClick={onSeeAllTransactions}
                                className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                See all
                            </button>
                        )}
                    </div>
                    {overview.recentTransactions.map((tx) => (
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
                                className={`shrink-0 ml-3 font-medium tabular-nums ${amountClassName} ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}
                            >
                                {fmt(tx.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
