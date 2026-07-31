'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getSubscriptionIntelligence } from '@/features/finance/lib/financeAggregations';
import type { FinanceSubscription } from '@/features/finance/types/finance';

interface SubscriptionIntelligenceProps {
    subscriptions: FinanceSubscription[];
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
    onManage?: () => void;
}

function daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function SubscriptionIntelligence({
    subscriptions,
    formatAmount,
    amountClassName,
    onManage,
}: SubscriptionIntelligenceProps) {
    const intel = getSubscriptionIntelligence(subscriptions);
    const active = subscriptions.filter((s) => s.active);

    const upcoming = active
        .filter((s) => s.nextBillingDate || s.nextChargeOn)
        .map((s) => {
            const dateStr = (s.nextBillingDate ?? s.nextChargeOn)!;
            return { sub: s, days: daysUntil(dateStr) };
        })
        .filter((x) => x.days >= 0 && x.days <= 14)
        .sort((a, b) => a.days - b.days);

    const byAmount = [...active].sort((a, b) => b.amount - a.amount);

    if (subscriptions.length === 0) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                    Subscription Intelligence
                </p>
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                    Add subscriptions to track recurring costs.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Cost summary */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Subscription Load
                    </p>
                    {onManage && (
                        <button
                            onClick={onManage}
                            className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            Manage
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Per Month
                        </p>
                        <p
                            className={`text-xl font-bold text-purple-400 tabular-nums mt-0.5 ${amountClassName ?? ''}`}
                        >
                            {formatAmount(intel.monthlyTotal, 'USD', 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Per Year
                        </p>
                        <p
                            className={`text-xl font-bold text-purple-300 tabular-nums mt-0.5 ${amountClassName ?? ''}`}
                        >
                            {formatAmount(intel.annualTotal, 'USD', 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Active
                        </p>
                        <p className="text-xl font-bold text-gray-700 dark:text-zinc-200 mt-0.5">
                            {active.length}
                        </p>
                    </div>
                </div>

                {/* Overlap alerts */}
                {intel.potentialOverlaps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-1.5">
                        {intel.potentialOverlaps.map((group) => (
                            <div
                                key={group[0]?.category ?? group[0]?.id}
                                className="flex items-start gap-1.5 text-xs text-amber-400"
                            >
                                <AlertTriangle
                                    size={11}
                                    className="shrink-0 mt-0.5"
                                />
                                {group.length} overlapping{' '}
                                {group[0]?.category ?? 'subscriptions'}:{' '}
                                {group.map((s) => s.name).join(', ')}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ranked by cost */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                    Ranked by Cost
                </p>
                <div className="space-y-1.5">
                    {byAmount.slice(0, 8).map((sub) => {
                        const monthlyCost =
                            sub.billingCycle === 'yearly' ||
                            sub.cadence === 'annual'
                                ? sub.amount / 12
                                : sub.billingCycle === 'weekly'
                                  ? sub.amount * 4.33
                                  : sub.amount;
                        const annualCost = monthlyCost * 12;
                        return (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0"
                            >
                                <div className="min-w-0">
                                    <span className="text-gray-700 dark:text-zinc-300 truncate block">
                                        {sub.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {sub.category} ·{' '}
                                        {formatAmount(annualCost, 'USD', 0)}/yr
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 ml-3 font-semibold tabular-nums text-purple-400 ${amountClassName ?? ''}`}
                                >
                                    {formatAmount(monthlyCost, 'USD', 0)}/mo
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming renewals */}
            {upcoming.length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                        Renewing in 14 Days
                    </p>
                    <div className="space-y-1.5">
                        {upcoming.map(({ sub, days }) => (
                            <div
                                key={sub.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${days === 0 ? 'bg-red-400' : days <= 3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    />
                                    <span className="text-gray-700 dark:text-zinc-300">
                                        {sub.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`font-semibold tabular-nums text-purple-400 ${amountClassName ?? ''}`}
                                    >
                                        {formatAmount(sub.amount, 'USD', 2)}
                                    </span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 w-14 text-right">
                                        {days === 0
                                            ? 'today'
                                            : days === 1
                                              ? 'tomorrow'
                                              : `in ${days}d`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Annualized tip */}
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 p-3">
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-zinc-400">
                    <ArrowRight
                        size={12}
                        className="text-purple-400 shrink-0 mt-0.5"
                    />
                    Your subscriptions cost{' '}
                    <span
                        className={`font-semibold text-purple-400 mx-1 ${amountClassName ?? ''}`}
                    >
                        {formatAmount(intel.annualTotal, 'USD', 0)}
                    </span>{' '}
                    per year. Cutting one service saves more than it seems.
                </div>
            </div>
        </div>
    );
}
