'use client';

import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { AutomationCenterController } from '@/features/automation/hooks/useAutomationCenter';
import {
    relativeTime,
    scheduleSummary,
    widgetEmoji,
} from '@/features/automation/lib/automationDisplay';

const CARD =
    'rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: number;
    icon: typeof PlayCircle;
    accent: string;
}) {
    return (
        <div className={CARD}>
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {label}
                </p>
                <Icon size={15} className={accent} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {value}
            </p>
        </div>
    );
}

export function AutomationOverview({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const { stats, approvals, nextDeliverable, setActiveTab } = controller;

    return (
        <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    label="Active"
                    value={stats.active}
                    icon={PlayCircle}
                    accent="text-emerald-500"
                />
                <StatCard
                    label="Paused"
                    value={stats.paused}
                    icon={PauseCircle}
                    accent="text-amber-500"
                />
                <StatCard
                    label="Needs approval"
                    value={stats.approvalRequired}
                    icon={ShieldCheck}
                    accent="text-blue-500"
                />
                <StatCard
                    label="Errors"
                    value={stats.errors}
                    icon={AlertTriangle}
                    accent="text-red-500"
                />
                <StatCard
                    label="Scheduled"
                    value={stats.scheduled}
                    icon={CalendarClock}
                    accent="text-zinc-400"
                />
            </section>

            {approvals.length > 0 && (
                <section
                    className={cn(
                        'rounded-2xl border p-4',
                        'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
                    )}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <ShieldCheck
                                size={18}
                                className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                            />
                            <div>
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    {approvals.length} action
                                    {approvals.length === 1 ? '' : 's'} awaiting
                                    your approval
                                </p>
                                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                    {approvals[0]?.automationName} ·{' '}
                                    {approvals[0]?.proposedAction}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('approvals')}
                            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Review
                        </button>
                    </div>
                </section>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
                <section className={CARD}>
                    <div className="mb-3 flex items-center gap-2">
                        <CalendarClock size={15} className="text-zinc-400" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Next scheduled deliverable
                        </h3>
                    </div>
                    {nextDeliverable ? (
                        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {nextDeliverable.name}
                                </p>
                                <span className="text-xs text-zinc-500">
                                    {relativeTime(
                                        nextDeliverable.nextGeneratedAt,
                                    )}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {scheduleSummary(nextDeliverable.schedule)} ·{' '}
                                {nextDeliverable.sourceWidgets.join(', ')}
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('deliverables')}
                                className="mt-3 text-xs font-semibold text-[#4f6ef7] hover:underline"
                            >
                                Manage deliverables →
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            No scheduled deliverables yet.
                        </p>
                    )}
                </section>

                <section className={CARD}>
                    <div className="mb-3 flex items-center gap-2">
                        <Sparkles size={15} className="text-zinc-400" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Suggestions for you
                        </h3>
                    </div>
                    {controller.suggestions.length > 0 ? (
                        <div className="space-y-2">
                            {controller.suggestions.slice(0, 3).map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-start gap-2 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950"
                                >
                                    <span className="text-base leading-none">
                                        {widgetEmoji(s.definition.widgetId)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                            {s.definition.name}
                                        </p>
                                        <p className="line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                            {s.reason}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setActiveTab('suggestions')}
                                className="text-xs font-semibold text-[#4f6ef7] hover:underline"
                            >
                                View all suggestions →
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <CheckCircle2
                                size={14}
                                className="text-emerald-500"
                            />
                            You are all caught up.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
