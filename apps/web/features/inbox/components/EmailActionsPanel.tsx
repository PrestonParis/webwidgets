'use client';

import { useState } from 'react';
import { EmailAction, ActionType } from '@/features/inbox/types/inbox';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { createCalendarEvent } from '@/features/calendar/api/calendarMutations';

const TYPE_CONFIG: Record<
    ActionType,
    { label: string; icon: string; color: string }
> = {
    deadline: {
        label: 'Deadline',
        icon: '⏰',
        color: 'text-red-500 dark:text-red-400',
    },
    event: {
        label: 'Event',
        icon: '📅',
        color: 'text-purple-500 dark:text-purple-400',
    },
    action: {
        label: 'Action',
        icon: '✓',
        color: 'text-blue-500 dark:text-blue-400',
    },
};

function formatDueDate(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.ceil(
        (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
    if (diffDays < 7)
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function addToTodo(action: EmailAction, userId: string): Promise<void> {
    const text = action.description
        ? `${action.title} — ${action.description}`
        : action.title;
    await supabase.from('todos').insert({ text, user_id: userId });
}

function formatCalendarLabel(start: {
    dateTime?: string;
    date?: string;
}): string {
    if (start.dateTime) {
        const d = new Date(start.dateTime);
        const time = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
        const date = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
        return `at ${time} ${date}`;
    }
    if (start.date) {
        const d = new Date(start.date + 'T12:00:00');
        return `on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return '';
}

async function addToCalendar(action: EmailAction): Promise<string> {
    const startTime: { dateTime?: string; date?: string } = {};
    const endTime: { dateTime?: string; date?: string } = {};
    if (action.due_date) {
        const isAllDay = /T00:00:00(\.000)?Z$/.test(action.due_date);
        if (isAllDay) {
            const dateOnly = action.due_date.slice(0, 10);
            startTime.date = dateOnly;
            endTime.date = dateOnly;
        } else {
            startTime.dateTime = action.due_date;
            endTime.dateTime = new Date(
                new Date(action.due_date).getTime() + 60 * 60 * 1000,
            ).toISOString();
        }
    } else {
        const today = new Date().toISOString().slice(0, 10);
        startTime.date = today;
        endTime.date = today;
    }
    const event = await createCalendarEvent({
        summary: action.title,
        ...(action.description ? { description: action.description } : {}),
        start: startTime,
        end: endTime,
    });
    return formatCalendarLabel(event.start);
}

function ActionRow({
    action,
    onToggle,
}: {
    action: EmailAction;
    onToggle: (id: string) => void;
}) {
    const cfg = TYPE_CONFIG[action.type];
    const dueLabel = formatDueDate(action.due_date);
    const isOverdue =
        action.due_date !== null && new Date(action.due_date) < new Date();
    const { user } = useAuthContext();
    const [added, setAdded] = useState(false);
    const [calAdded, setCalAdded] = useState<string | null>(null);

    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
            <button
                onClick={() => onToggle(action.id)}
                className="mt-0.5 w-5 h-5 rounded border border-gray-300 dark:border-zinc-600 flex items-center justify-center shrink-0 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                aria-label="Mark complete"
            >
                {action.completed && (
                    <span className="text-[10px] text-blue-500">✓</span>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">
                    {action.title}
                </p>
                {action.description && (
                    <p className="text-xs text-gray-500 dark:text-zinc-500 truncate mt-0.5">
                        {action.description}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {action.action_url && (
                        <a
                            href={action.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Open link →
                        </a>
                    )}
                    <button
                        onClick={() => {
                            if (added || !user?.id) return;
                            void addToTodo(action, user.id).then(() =>
                                setAdded(true),
                            );
                        }}
                        className={`text-[10px] font-semibold transition-colors ${
                            added
                                ? 'text-green-500 dark:text-green-400 cursor-default'
                                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                        }`}
                    >
                        {added ? '+ Added to To-Do' : '+ To-Do'}
                    </button>
                    {action.type === 'event' && (
                        <button
                            onClick={() => {
                                if (calAdded) return;
                                void addToCalendar(action).then((label) =>
                                    setCalAdded(label || 'on calendar'),
                                );
                            }}
                            className={`text-[10px] font-semibold transition-colors ${
                                calAdded
                                    ? 'text-green-500 dark:text-green-400 cursor-default'
                                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                            }`}
                        >
                            {calAdded
                                ? `+ Added to calendar ${calAdded}`
                                : '+ Calendar'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {dueLabel && (
                    <span
                        className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400 dark:text-zinc-500'}`}
                    >
                        {dueLabel}
                    </span>
                )}
                <span className={`text-xs font-medium ${cfg.color}`}>
                    {cfg.icon}
                </span>
            </div>
        </div>
    );
}

const INITIAL_VISIBLE = 4;

export function EmailActionsPanel({
    actions,
    loading,
    onToggle,
}: {
    actions: EmailAction[];
    loading: boolean;
    onToggle: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const activeActions = actions.filter((a) => !a.completed);
    const visible = expanded
        ? activeActions
        : activeActions.slice(0, INITIAL_VISIBLE);
    const hiddenCount = activeActions.length - INITIAL_VISIBLE;

    if (loading && activeActions.length === 0) {
        return (
            <div className="p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 animate-pulse space-y-3">
                <div className="h-3.5 w-28 bg-gray-200 dark:bg-zinc-700 rounded" />
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-9 bg-gray-100 dark:bg-zinc-800 rounded-lg"
                    />
                ))}
            </div>
        );
    }

    if (activeActions.length === 0) return null;

    return (
        <div className="p-5 bg-linear-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-zinc-900 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                    Action Items
                </h3>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    {activeActions.length}
                </span>
            </div>

            <div>
                {visible.map((action) => (
                    <ActionRow
                        key={action.id}
                        action={action}
                        onToggle={onToggle}
                    />
                ))}
            </div>

            {hiddenCount > 0 && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 mt-2 transition-colors"
                >
                    {expanded ? '↑ Show less' : `↓ ${hiddenCount} more`}
                </button>
            )}
        </div>
    );
}
