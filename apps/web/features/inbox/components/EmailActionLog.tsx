'use client';

import { useState } from 'react';
import type { ActionType, EmailAction } from '@/features/inbox/types/inbox';
import { useEmailActionLog } from '@/features/inbox/hooks/useEmailActionLog';

const TYPE_LABEL: Record<ActionType, string> = {
    action: 'Action',
    event: 'Event',
    deadline: 'Deadline',
};

const TYPE_DOT: Record<ActionType, string> = {
    action: 'bg-blue-400 dark:bg-blue-500',
    event: 'bg-purple-400 dark:bg-purple-500',
    deadline: 'bg-red-400 dark:bg-red-500',
};

function groupByDate(
    actions: EmailAction[],
): Array<{ label: string; items: EmailAction[] }> {
    const now = new Date();
    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);

    const buckets: Record<string, EmailAction[]> = {
        Today: [],
        Yesterday: [],
        'This week': [],
        Older: [],
    };

    for (const action of actions) {
        const d = new Date(action.created_at);
        if (d >= startOfToday) buckets['Today']!.push(action);
        else if (d >= startOfYesterday) buckets['Yesterday']!.push(action);
        else if (d >= startOfWeek) buckets['This week']!.push(action);
        else buckets['Older']!.push(action);
    }

    return Object.entries(buckets)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }));
}

function LogRow({
    action,
    onRestore,
}: {
    action: EmailAction;
    onRestore: (id: string) => void;
}) {
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-zinc-800 last:border-0 group">
            <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[action.type]}`}
                title={TYPE_LABEL[action.type]}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug line-through text-gray-400 dark:text-zinc-500">
                    {action.title}
                </p>
                {action.description && (
                    <p className="text-xs text-gray-400 dark:text-zinc-600 truncate mt-0.5">
                        {action.description}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRestore(action.id)}
                className="text-[10px] text-gray-300 dark:text-zinc-700 hover:text-gray-500 dark:hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                aria-label="Restore action"
            >
                Undo
            </button>
        </div>
    );
}

const INITIAL_VISIBLE = 3;

export function EmailActionLog() {
    const { log, loading, restore } = useEmailActionLog();
    const [expanded, setExpanded] = useState(false);

    if (loading && log.length === 0) return null;
    if (log.length === 0) return null;

    const groups = groupByDate(log);
    const allItems = groups.flatMap((g) => g.items);
    const visibleItems = expanded
        ? allItems
        : allItems.slice(0, INITIAL_VISIBLE);
    const hiddenCount = allItems.length - INITIAL_VISIBLE;

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                    Action Log
                </h3>
                <span className="text-xs text-gray-400 dark:text-zinc-600 font-medium">
                    {allItems.length} completed
                </span>
            </div>

            <div className="px-5 pt-1 pb-3">
                {visibleItems.map((action) => (
                    <LogRow
                        key={action.id}
                        action={action}
                        onRestore={(id) => {
                            void restore(id);
                        }}
                    />
                ))}

                {hiddenCount > 0 && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 mt-2 transition-colors"
                    >
                        {expanded ? '↑ Show less' : `↓ ${hiddenCount} more`}
                    </button>
                )}
            </div>
        </div>
    );
}
