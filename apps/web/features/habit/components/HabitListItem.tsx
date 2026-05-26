'use client';

import { useState } from 'react';
import { Clock, X } from 'lucide-react';
import type { HabitListItemProps } from '@/features/habit/types/habit';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import { cn } from '@/lib/utils/utils';

function formatDisplayTime(isoStr: string): string {
    if (!isoStr.includes('T')) return '';
    return new Date(isoStr).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function HabitListItem({
    habit,
    done,
    streak,
    days,
    onToggle,
    onDelete,
    lastCompletedLabel,
    bestStreak,
    frequencyLabel,
    completionId,
    completionTime,
    onEditTime,
}: HabitListItemProps) {
    const [editingTime, setEditingTime] = useState(false);

    const displayTime = completionTime ? formatDisplayTime(completionTime) : '';

    return (
        <li
            className="group"
            aria-label={`${habit.name}, ${done ? 'logged' : 'not logged'}`}
        >
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={done}
                    aria-label={done ? 'Remove log' : 'Log now'}
                    className={cn(
                        'w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all text-sm',
                        done
                            ? 'bg-violet-500 border-violet-500'
                            : 'border-stone-300 dark:border-zinc-600 hover:border-violet-400',
                    )}
                >
                    {done && <span className="text-white text-xs">✓</span>}
                </button>

                <span className="text-base leading-none">{habit.emoji}</span>

                <div className="flex-1 min-w-0">
                    <span
                        className={cn(
                            'block text-sm truncate',
                            done
                                ? 'text-stone-400 dark:text-zinc-600'
                                : 'text-stone-700 dark:text-zinc-300',
                        )}
                    >
                        {habit.name}
                    </span>
                    {(lastCompletedLabel ?? frequencyLabel) && !done && (
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                            {[frequencyLabel, lastCompletedLabel]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                    )}
                </div>

                {/* Time chip — shown when done */}
                {done && onEditTime && completionId && (
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setEditingTime((v) => !v)}
                            title="Edit logged time"
                            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                        >
                            <Clock className="h-2.5 w-2.5" />
                            {displayTime || 'set time'}
                        </button>
                    </div>
                )}

                {streak > 0 && (
                    <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 flex items-center gap-0.5 shrink-0">
                        🔥{streak}
                    </span>
                )}
                {bestStreak !== undefined && bestStreak > streak && (
                    <span className="text-[9px] text-stone-400 dark:text-zinc-500 shrink-0">
                        best {bestStreak}
                    </span>
                )}

                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete ${habit.name}`}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all shrink-0"
                >
                    <X size={12} />
                </button>
            </div>

            <div className="flex gap-1 mt-1.5 ml-8" aria-hidden="true">
                {days.map(({ date, done: d }) => (
                    <div
                        key={date}
                        className={cn(
                            'w-2.5 h-2.5 rounded-full transition-colors',
                            d
                                ? 'bg-violet-400 dark:bg-violet-500'
                                : 'bg-stone-100 dark:bg-zinc-800',
                        )}
                        title={date}
                    />
                ))}
            </div>

            {editingTime && done && onEditTime && completionId && (
                <div className="mt-2 flex justify-end">
                    <DatePicker
                        value={completionTime ?? new Date().toISOString()}
                        onChange={(iso) => {
                            onEditTime(completionId, iso);
                            setEditingTime(false);
                        }}
                        onCancel={() => setEditingTime(false)}
                        saveLabel="Save log time"
                    />
                </div>
            )}
        </li>
    );
}
