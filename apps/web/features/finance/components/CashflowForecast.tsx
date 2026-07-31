'use client';

import { AlertTriangle } from 'lucide-react';
import {
    projectCashflow7Day,
    filterToLastNDays,
} from '@/features/finance/lib/financeAggregations';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface CashflowForecastProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
}

export function CashflowForecast({
    accounts,
    transactions,
    subscriptions,
    formatAmount,
    amountClassName,
}: CashflowForecastProps) {
    const projection = projectCashflow7Day(
        accounts,
        transactions,
        subscriptions,
    );
    const last30 = filterToLastNDays(transactions, 30);
    const hasSpend = last30.some(
        (tx) => tx.type === 'expense' || tx.amount < 0,
    );

    const lowestBalance = Math.min(...projection.map((d) => d.balance));
    const worstCaseDay = projection.find((d) => d.balance === lowestBalance);

    // 30-day worst/best case from current cash
    const cash = accounts
        .filter((a) => ['cash', 'checking', 'savings'].includes(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const totalExpenses = last30
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const totalIncome30 = last30
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const subMonthly = subscriptions.reduce((s, sub) => {
        if (!sub.active) return s;
        if (sub.billingCycle === 'yearly' || sub.cadence === 'annual')
            return s + sub.amount / 12;
        if (sub.billingCycle === 'weekly') return s + sub.amount * 4.33;
        return s + sub.amount;
    }, 0);
    const worstCase30 = cash - totalExpenses - subMonthly;
    const bestCase30 = cash - subMonthly * 0.5;

    if (accounts.length === 0) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                    Cashflow Forecast
                </p>
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                    Add accounts to see your cashflow projection.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* 7-day bar projection */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4">
                    7-Day Projection
                </p>
                {!hasSpend ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        Add transactions to unlock cashflow forecasting.
                    </p>
                ) : (
                    <>
                        <div className="flex items-end gap-1.5 h-20 mb-2">
                            {projection.map((day) => {
                                const maxBal = Math.max(
                                    ...projection.map((d) =>
                                        Math.max(d.balance, 0),
                                    ),
                                );
                                const heightPct =
                                    maxBal > 0
                                        ? Math.max(
                                              (Math.max(day.balance, 0) /
                                                  maxBal) *
                                                  100,
                                              4,
                                          )
                                        : 4;
                                const isLow = day.balance < 200;
                                const barColor = isLow
                                    ? 'bg-red-400/70'
                                    : day.event
                                      ? 'bg-amber-400/70'
                                      : 'bg-emerald-500/50';
                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 flex flex-col items-center gap-1"
                                    >
                                        <div
                                            className="w-full rounded-t"
                                            style={{ height: `${heightPct}%` }}
                                        >
                                            <div
                                                className={`w-full h-full rounded-t ${barColor} transition-all`}
                                            />
                                        </div>
                                        <span className="text-[9px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                                            {day.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Event list */}
                        <div className="space-y-1.5 mt-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
                            {projection.map((day) => (
                                <div
                                    key={day.date}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 dark:text-zinc-500 w-14">
                                            {day.label}
                                        </span>
                                        {day.event ? (
                                            <span className="text-amber-400 flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                {day.event.name} (
                                                {formatAmount(
                                                    day.event.amount,
                                                    'USD',
                                                    0,
                                                )}
                                                )
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-zinc-600">
                                                avg spend
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`font-semibold tabular-nums ${amountClassName ?? ''} ${day.balance < 0 ? 'text-red-400' : day.balance < 200 ? 'text-amber-400' : 'text-gray-700 dark:text-zinc-300'}`}
                                    >
                                        {formatAmount(day.balance, 'USD', 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* 30-day scenarios */}
            {hasSpend && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        30-Day Scenarios
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
                                Worst case
                            </p>
                            <p
                                className={`text-lg font-bold tabular-nums ${amountClassName ?? ''} ${worstCase30 < 0 ? 'text-red-400' : 'text-amber-400'}`}
                            >
                                {formatAmount(worstCase30, 'USD', 0)}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                No extra income, avg spend
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
                                Best case
                            </p>
                            <p
                                className={`text-lg font-bold tabular-nums ${amountClassName ?? ''} ${bestCase30 > totalIncome30 ? 'text-emerald-400' : 'text-cyan-400'}`}
                            >
                                {formatAmount(bestCase30, 'USD', 0)}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                Reduced discretionary spend
                            </p>
                        </div>
                    </div>
                    {worstCaseDay && worstCaseDay.balance < 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-start gap-2 text-xs text-red-400">
                            <AlertTriangle
                                size={12}
                                className="shrink-0 mt-0.5"
                            />
                            Balance may go negative by{' '}
                            {new Date(worstCaseDay.date).toLocaleDateString(
                                'en-US',
                                {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                },
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
