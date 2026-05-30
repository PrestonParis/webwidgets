'use client';

import type { FinanceSubscription } from '@/features/finance/types/finance';

interface SubscriptionTimelineProps {
    subscriptions: FinanceSubscription[];
    formatAmount?: ((n: number) => string) | undefined;
    amountClassName?: string;
}

interface DayEntry {
    day: number;
    subs: FinanceSubscription[];
}

function buildCalendar(subscriptions: FinanceSubscription[]): DayEntry[] {
    const now = new Date();
    const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
    ).getDate();
    const active = subscriptions.filter((s) => s.active && s.nextBillingDate);

    return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const subs = active.filter((s) => {
            const d = s.nextBillingDate ? new Date(s.nextBillingDate) : null;
            return (
                d &&
                d.getDate() === day &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
            );
        });
        return { day, subs };
    });
}

export function SubscriptionTimeline({
    subscriptions,
    formatAmount,
    amountClassName = '',
}: SubscriptionTimelineProps) {
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));
    const now = new Date();
    const monthLabel = now.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });
    const today = now.getDate();
    const calendar = buildCalendar(subscriptions);
    const firstDow = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const maxCost = Math.max(
        ...calendar.map((e) => e.subs.reduce((s, sub) => s + sub.amount, 0)),
        0.1,
    );
    const activeCount = subscriptions.filter(
        (s) => s.active && s.nextBillingDate,
    ).length;

    if (activeCount === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-zinc-500">
                    No upcoming billing dates. Add a next billing date to
                    subscriptions
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs text-zinc-500">{monthLabel}</p>
            <div className="grid grid-cols-7 gap-px text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div
                        key={d}
                        className="text-[9px] uppercase tracking-widest text-zinc-600 pb-1"
                    >
                        {d}
                    </div>
                ))}
                {Array.from({ length: firstDow }, (_, i) => (
                    <div key={`pad-${i}`} />
                ))}
                {calendar.map(({ day, subs }) => {
                    const cost = subs.reduce((s, sub) => s + sub.amount, 0);
                    const intensity =
                        cost > 0 ? Math.max(0.15, cost / maxCost) : 0;
                    const isPast = day < today;
                    const isToday = day === today;

                    return (
                        <div
                            key={day}
                            className="relative group"
                            title={
                                subs
                                    .map((s) => `${s.name} ${fmt(s.amount)}`)
                                    .join('\n') || undefined
                            }
                        >
                            <div
                                className={`
                                mx-auto w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-default
                                ${isToday ? 'ring-1 ring-emerald-500' : ''}
                                ${isPast ? 'opacity-40' : ''}
                                ${subs.length > 0 ? 'text-orange-300 font-semibold' : 'text-zinc-500'}
                            `}
                                style={
                                    subs.length > 0
                                        ? {
                                              backgroundColor: `rgba(249, 115, 22, ${intensity * 0.22})`,
                                          }
                                        : undefined
                                }
                            >
                                {day}
                            </div>
                            {subs.length > 0 && (
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-[10px] whitespace-nowrap shadow-xl">
                                    {subs.map((s) => (
                                        <div
                                            key={s.id}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-zinc-300">
                                                {s.name}
                                            </span>
                                            <span
                                                className={`text-orange-300 ${amountClassName}`}
                                            >
                                                {fmt(s.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
