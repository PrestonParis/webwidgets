'use client';

import { getFinanceTimeline } from '@/features/finance/lib/financeAggregations';
import type {
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface FinanceTimelineProps {
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
}

const KIND_COLORS = {
    income: 'text-emerald-400',
    expense: 'text-red-400',
    subscription: 'text-purple-400',
    transfer: 'text-blue-400',
} as const;

const KIND_DOT = {
    income: 'bg-emerald-400',
    expense: 'bg-red-400',
    subscription: 'bg-purple-400',
    transfer: 'bg-blue-400',
} as const;

export function FinanceTimeline({
    transactions,
    subscriptions,
    formatAmount,
    amountClassName,
}: Props) {
    const events = getFinanceTimeline(transactions, subscriptions);

    if (events.length === 0) {
        return (
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                    Finance Timeline
                </p>
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                    No transactions yet.
                </p>
            </div>
        );
    }

    let lastDate = '';

    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">
                Finance Timeline
            </p>
            <div className="space-y-0">
                {events.map((event, i) => {
                    const showDate = event.date !== lastDate;
                    lastDate = event.date;
                    const formatted = new Date(
                        event.date + 'T00:00:00',
                    ).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    });
                    const amountSign = event.amount >= 0 ? '+' : '';
                    return (
                        <div key={`${event.date}-${event.label}-${i}`}>
                            {showDate && (
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mt-3 mb-1.5 first:mt-0">
                                    {formatted}
                                </p>
                            )}
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-zinc-800/60 last:border-0">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${KIND_DOT[event.kind]}`}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-zinc-300 truncate">
                                        {event.label}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 ml-3 text-sm font-semibold tabular-nums ${amountClassName ?? ''} ${KIND_COLORS[event.kind]}`}
                                >
                                    {amountSign}
                                    {formatAmount(
                                        Math.abs(event.amount),
                                        'USD',
                                        2,
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
