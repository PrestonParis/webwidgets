'use client';

import { useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Clock,
    Loader2,
    MinusCircle,
    RotateCcw,
    ShieldQuestion,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { EmptyState } from '@/features/ui/components/EmptyState';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { AutomationCenterController } from '@/features/automation/hooks/useAutomationCenter';
import type {
    AutomationRunRecord,
    AutomationRunStatus,
} from '@/features/automation/types/automation';
import {
    RUN_STATUS_LABELS,
    RUN_STATUS_STYLES,
    formatDuration,
    relativeTime,
    widgetEmoji,
} from '@/features/automation/lib/automationDisplay';

const RUN_STATUS_ICONS: Record<AutomationRunStatus, LucideIcon> = {
    queued: Clock,
    running: Loader2,
    waiting_for_approval: ShieldQuestion,
    completed: CheckCircle2,
    failed: XCircle,
    skipped: MinusCircle,
    cancelled: AlertCircle,
};

const STATUS_FILTERS: { value: AutomationRunStatus | 'all'; label: string }[] =
    [
        { value: 'all', label: 'All' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'waiting_for_approval', label: 'Awaiting approval' },
        { value: 'skipped', label: 'Skipped' },
    ];

function RunRow({
    run,
    expanded,
    onToggle,
}: {
    run: AutomationRunRecord;
    expanded: boolean;
    onToggle: () => void;
}) {
    const Icon = RUN_STATUS_ICONS[run.status];
    const toast = useToastContext();

    return (
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-3 p-4 text-left"
            >
                <Icon
                    size={16}
                    className={cn(
                        'shrink-0',
                        RUN_STATUS_STYLES[run.status],
                        run.status === 'running' && 'animate-spin',
                    )}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {run.automationName}
                        </p>
                        <span
                            className={cn(
                                'text-[11px] font-medium',
                                RUN_STATUS_STYLES[run.status],
                            )}
                        >
                            {RUN_STATUS_LABELS[run.status]}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {widgetEmoji(
                            run.widgetName.toLowerCase(),
                        )}{' '}
                        {run.widgetName} · {run.triggeredBy} ·{' '}
                        {relativeTime(run.startedAt)}
                    </p>
                </div>
                <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                    {formatDuration(run.durationMs)}
                </span>
                <ChevronDown
                    size={15}
                    className={cn(
                        'shrink-0 text-zinc-400 transition-transform',
                        expanded && 'rotate-180',
                    )}
                />
            </button>

            {expanded && (
                <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    {run.summary && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                            {run.summary}
                        </p>
                    )}
                    {run.outputGenerated && (
                        <div className="mt-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
                            <p className="text-[10px] uppercase text-zinc-400">
                                Output
                            </p>
                            <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                                {run.outputGenerated}
                            </p>
                        </div>
                    )}
                    {run.actionsAttempted &&
                        run.actionsAttempted.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {run.actionsAttempted.map((action) => (
                                    <span
                                        key={action}
                                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                    >
                                        {action.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}
                    {run.errorMessage && (
                        <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {run.errorMessage}
                        </p>
                    )}
                    {run.status === 'failed' && (
                        <button
                            type="button"
                            onClick={() =>
                                toast.info(
                                    `Retry for "${run.automationName}" coming soon`,
                                )
                            }
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <RotateCcw size={13} />
                            Retry
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function AutomationRunHistory({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const { filteredRuns, historyStatus, setHistoryStatus } = controller;
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setHistoryStatus(option.value)}
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            historyStatus === option.value
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {filteredRuns.length === 0 ? (
                <EmptyState
                    icon={Clock}
                    title="No runs to show"
                    description="Automation runs will appear here once your automations execute."
                />
            ) : (
                <div className="grid gap-2.5">
                    {filteredRuns.map((run) => (
                        <RunRow
                            key={run.id}
                            run={run}
                            expanded={expandedId === run.id}
                            onToggle={() =>
                                setExpandedId((current) =>
                                    current === run.id ? null : run.id,
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
