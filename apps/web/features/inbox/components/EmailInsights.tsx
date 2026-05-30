import { useMemo } from 'react';
import type { Email, EmailAction } from '../types/inbox';

export type InboxFilter = string | null;

// Special filter keys (category names are passed as plain strings)
export const FILTER_ATTENTION = 'attention';
export const FILTER_TASKS = 'tasks';
export const FILTER_DEADLINES = 'deadlines';
export const FILTER_MEETINGS = 'meetings';

interface StatChipProps {
    label: string;
    value: number;
    active: boolean;
    filterKey: InboxFilter;
    highlight?: boolean | undefined;
    onClick: (key: InboxFilter) => void;
}

function StatChip({
    label,
    value,
    active,
    filterKey,
    highlight,
    onClick,
}: StatChipProps) {
    return (
        <button
            type="button"
            onClick={() => onClick(active ? null : filterKey)}
            className={`flex flex-col items-center px-3.5 py-2 rounded-xl border transition-all ${
                active
                    ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950'
                    : highlight
                      ? 'border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                      : 'border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
            }`}
        >
            <span
                className={`text-base font-bold tabular-nums leading-tight ${
                    active
                        ? ''
                        : highlight
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-900 dark:text-zinc-100'
                }`}
            >
                {value}
            </span>
            <span
                className={`text-[10px] font-medium leading-tight mt-0.5 whitespace-nowrap ${
                    active ? 'opacity-80' : 'text-gray-500 dark:text-zinc-500'
                }`}
            >
                {label}
            </span>
        </button>
    );
}

export function InboxIntelligence({
    emails,
    actions,
    activeFilter,
    onFilter,
}: {
    emails: Email[];
    actions: EmailAction[];
    activeFilter: InboxFilter;
    onFilter: (f: InboxFilter) => void;
}) {
    const stats = useMemo(() => {
        const total = emails.length;
        const needsAttention = emails.filter(
            (e) => e.category === 'work' || e.category === 'finance',
        ).length;
        const tasks = actions.filter(
            (a) => a.type === 'action' && !a.completed,
        ).length;
        const deadlines = actions.filter(
            (a) => a.type === 'deadline' && !a.completed,
        ).length;
        const meetings = actions.filter(
            (a) => a.type === 'event' && !a.completed,
        ).length;
        return { total, needsAttention, tasks, deadlines, meetings };
    }, [emails, actions]);

    if (emails.length === 0) return null;

    const chips: Array<{
        label: string;
        value: number;
        key: InboxFilter;
        highlight?: boolean | undefined;
    }> = [
        { label: 'Emails', value: stats.total, key: null },
        {
            label: 'Need Attention',
            value: stats.needsAttention,
            key: FILTER_ATTENTION,
            highlight: stats.needsAttention > 0,
        },
        {
            label: 'Tasks',
            value: stats.tasks,
            key: FILTER_TASKS,
            highlight: stats.tasks > 0,
        },
        {
            label: 'Deadlines',
            value: stats.deadlines,
            key: FILTER_DEADLINES,
            highlight: stats.deadlines > 0,
        },
        { label: 'Meetings', value: stats.meetings, key: FILTER_MEETINGS },
    ];

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {chips.map((chip) => (
                <StatChip
                    key={chip.label}
                    label={chip.label}
                    value={chip.value}
                    active={activeFilter === chip.key}
                    filterKey={chip.key}
                    highlight={chip.highlight}
                    onClick={onFilter}
                />
            ))}
        </div>
    );
}

export { InboxIntelligence as EmailInsights };
