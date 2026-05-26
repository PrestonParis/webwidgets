'use client';

import { useMemo, useState } from 'react';
import {
    BookMarked,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Import,
    Plus,
    Repeat2,
    Trophy,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useHabits } from '@/features/habit/hooks/useHabits';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';
import HabitEmptyState from '@/features/habit/components/HabitEmptyState';
import { frequencyLabel } from '@/features/habit/lib/habitUtils';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import type { HabitFrequency } from '@/features/habit/types/habit';
import { cn } from '@/lib/utils/utils';

type View = 'summary' | 'today' | 'streaks' | 'calendar' | 'history';
type Panel = null | 'add' | 'repeat' | 'archive' | 'import';

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'custom', label: 'Custom' },
];
const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function intensityClass(count: number, isCurrentMonth: boolean) {
    if (!isCurrentMonth) return 'bg-transparent';
    if (count === 0) return 'bg-stone-100 dark:bg-zinc-800';
    if (count === 1) return 'bg-violet-200 dark:bg-violet-900/50';
    if (count === 2) return 'bg-violet-400 dark:bg-violet-600';
    return 'bg-violet-600 dark:bg-violet-400';
}

function formatHistoryTime(isoStr: string): string {
    if (!isoStr.includes('T')) return '';
    return new Date(isoStr).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function HabitWidget() {
    const [view, setView] = useState<View>('summary');
    const [panel, setPanel] = useState<Panel>(null);
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calHabitIdx, setCalHabitIdx] = useState(0);
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);
    const [importRows, setImportRows] = useState<string[]>(['']);
    const [importFreq, setImportFreq] = useState<HabitFrequency>('daily');
    const [newHabitFreq, setNewHabitFreq] = useState<HabitFrequency>('daily');

    const {
        habits,
        completions,
        loading,
        archivedIds,
        repeatConfigs,
        addHabit,
        deleteHabit,
        toggleCompletion,
        isCompletedToday,
        archiveHabit,
        unarchiveHabit,
        setRepeatConfig,
        importHabits,
        getHabitStreak,
        getHabitBestStreak,
        getHabitLastCompletedLabel,
        getLast7Days,
        getCalendarMonth,
        getCompletionToday,
        updateCompletionTime,
    } = useHabits();

    const {
        newName,
        newEmoji,
        setNewName,
        setNewEmoji,
        handleSubmit,
        handleCancel,
        openForm,
    } = useHabitForm({ onAdd: addHabit });

    function togglePanel(p: Panel) {
        setPanel((prev) => {
            if (prev === p) return null;
            if (p === 'add') openForm();
            return p;
        });
    }

    function switchView(v: View) {
        setView(v);
        setPanel(null);
    }

    function updateImportRow(index: number, value: string) {
        setImportRows((rows) =>
            rows.map((row, rowIndex) => (rowIndex === index ? value : row)),
        );
    }

    function appendImportNames(names: string[]) {
        const nextNames = names.map((name) => name.trim()).filter(Boolean);
        if (nextNames.length === 0) return;
        setImportRows((rows) => {
            const filled = rows.filter((row) => row.trim());
            return [...filled, ...nextNames, ''];
        });
    }

    function parseImportText(text: string): string[] {
        return text
            .split(/\r?\n|,/)
            .map((part) => part.replace(/^["']|["']$/g, '').trim())
            .filter(Boolean);
    }

    async function handleImportFile(file: File | null) {
        if (!file) return;
        appendImportNames(parseImportText(await file.text()));
    }

    const importNames = importRows.map((row) => row.trim()).filter(Boolean);

    const activeEvents = useMemo(
        () => habits.filter((h) => !archivedIds.has(h.id)),
        [habits, archivedIds],
    );

    const archivedEvents = useMemo(
        () => habits.filter((h) => archivedIds.has(h.id)),
        [habits, archivedIds],
    );

    const stats = useMemo(() => {
        const loggedToday = activeEvents.filter((h) =>
            isCompletedToday(h.id),
        ).length;
        const streaks = activeEvents.map((h) => getHabitStreak(h.id));
        const bestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
        const completionRate =
            activeEvents.length > 0 ? loggedToday / activeEvents.length : 0;
        const topEvent = activeEvents.find(
            (h) => getHabitStreak(h.id) === bestStreak,
        );
        return { loggedToday, bestStreak, completionRate, topEvent };
    }, [activeEvents, isCompletedToday, getHabitStreak]);

    const sortedByStreak = useMemo(
        () =>
            [...activeEvents].sort(
                (a, b) => getHabitStreak(b.id) - getHabitStreak(a.id),
            ),
        [activeEvents, getHabitStreak],
    );

    const calEvent = activeEvents[calHabitIdx] ?? activeEvents[0];
    const calDays = useMemo(
        () =>
            calEvent ? getCalendarMonth(calYear, calMonth, calEvent.id) : [],
        [calEvent, calYear, calMonth, getCalendarMonth],
    );

    const historyByDate = useMemo(() => {
        const sorted = [...completions].sort((a, b) =>
            b.completed_date.localeCompare(a.completed_date),
        );
        const grouped: {
            date: string;
            entries: {
                habitId: string;
                name: string;
                emoji: string;
                time: string;
            }[];
        }[] = [];
        for (const c of sorted) {
            const habit = habits.find((h) => h.id === c.habit_id);
            if (!habit) continue;
            const dateKey = c.completed_date.slice(0, 10);
            let group = grouped.find((g) => g.date === dateKey);
            if (!group) {
                group = { date: dateKey, entries: [] };
                grouped.push(group);
            }
            group.entries.push({
                habitId: habit.id,
                name: habit.name,
                emoji: habit.emoji,
                time: formatHistoryTime(c.completed_date),
            });
        }
        return grouped.slice(0, 14);
    }, [completions, habits]);

    if (loading) {
        return (
            <WidgetShell
                icon={<ClipboardList className="h-4 w-4 text-violet-500" />}
                title="All Logging"
                footerHref="/habit"
                footerLabel="Open logging dashboard"
                widgetId="habit-widget"
                widgetType="habit"
            >
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 animate-pulse"
                        />
                    ))}
                </div>
            </WidgetShell>
        );
    }

    return (
        <WidgetShell
            icon={<ClipboardList className="h-4 w-4 text-violet-500" />}
            title="All Logging"
            footerHref="/habit"
            footerLabel="Open logging dashboard"
            widgetId="habit-widget"
            widgetType="habit"
        >
            <div className="space-y-3">
                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1">
                    <button
                        type="button"
                        onClick={() => switchView('summary')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === null && view === 'summary'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        Summary
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('add')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === 'add'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('today')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === null && view === 'today'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        Log
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('repeat')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors',
                            panel === 'repeat'
                                ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        <Repeat2 className="h-3 w-3" /> Schedule
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('calendar')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === null && view === 'calendar'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        Calendar
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('streaks')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === null && view === 'streaks'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        Streaks
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('history')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                            panel === null && view === 'history'
                                ? 'bg-violet-600 text-white'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('archive')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors',
                            panel === 'archive'
                                ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        <BookMarked className="h-3 w-3" /> Archive
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('import')}
                        className={cn(
                            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors',
                            panel === 'import'
                                ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
                        )}
                    >
                        <Import className="h-3 w-3" /> Import
                    </button>
                </div>

                {/* Panels */}
                {panel === 'add' && (
                    <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/10 p-3">
                        <p className="text-[11px] font-semibold text-violet-500 dark:text-violet-300 uppercase tracking-wide mb-2">
                            New trackable event
                        </p>
                        <HabitAddForm
                            newName={newName}
                            newEmoji={newEmoji}
                            onNameChange={setNewName}
                            onEmojiChange={setNewEmoji}
                            frequency={newHabitFreq}
                            onFrequencyChange={setNewHabitFreq}
                            onSubmit={(e) => {
                                void (async () => {
                                    await handleSubmit(e);
                                    setPanel(null);
                                })();
                            }}
                            onCancel={() => {
                                handleCancel();
                                setPanel(null);
                            }}
                        />
                    </div>
                )}

                {panel === 'repeat' && (
                    <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
                        <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                            Schedule
                        </p>
                        {activeEvents.length === 0 ? (
                            <p className="text-xs text-stone-400 dark:text-zinc-500">
                                No active events.
                            </p>
                        ) : (
                            activeEvents.map((habit) => {
                                const cfg = repeatConfigs[habit.id];
                                const freq = cfg?.frequency ?? 'daily';
                                return (
                                    <div key={habit.id} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                                {habit.emoji}
                                            </span>
                                            <span className="flex-1 text-xs font-medium text-stone-700 dark:text-zinc-200 truncate">
                                                {habit.name}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 flex-wrap ml-6">
                                            {FREQ_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        setRepeatConfig(
                                                            habit.id,
                                                            {
                                                                frequency:
                                                                    opt.value,
                                                            },
                                                        )
                                                    }
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                                        freq === opt.value
                                                            ? 'bg-violet-500 text-white'
                                                            : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700',
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {freq === 'custom' && (
                                            <div className="flex gap-1 ml-6">
                                                {DOW_LABELS.map((d, idx) => {
                                                    const selected =
                                                        cfg?.daysOfWeek?.includes(
                                                            idx,
                                                        ) ?? false;
                                                    return (
                                                        <button
                                                            key={d}
                                                            type="button"
                                                            onClick={() => {
                                                                const current =
                                                                    cfg?.daysOfWeek ??
                                                                    [];
                                                                const next =
                                                                    selected
                                                                        ? current.filter(
                                                                              (
                                                                                  x,
                                                                              ) =>
                                                                                  x !==
                                                                                  idx,
                                                                          )
                                                                        : [
                                                                              ...current,
                                                                              idx,
                                                                          ];
                                                                setRepeatConfig(
                                                                    habit.id,
                                                                    {
                                                                        frequency:
                                                                            'custom',
                                                                        daysOfWeek:
                                                                            next,
                                                                    },
                                                                );
                                                            }}
                                                            className={cn(
                                                                'w-6 h-6 rounded text-[10px] font-medium transition-colors',
                                                                selected
                                                                    ? 'bg-violet-500 text-white'
                                                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                                                            )}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {panel === 'archive' && (
                    <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
                        <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                            Archive Events
                        </p>
                        {habits.length === 0 ? (
                            <p className="text-xs text-stone-400 dark:text-zinc-500">
                                No events yet.
                            </p>
                        ) : (
                            <>
                                {activeEvents.map((habit) => (
                                    <div
                                        key={habit.id}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-sm">
                                            {habit.emoji}
                                        </span>
                                        <span className="flex-1 text-xs text-stone-700 dark:text-zinc-200 truncate">
                                            {habit.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                archiveHabit(habit.id)
                                            }
                                            className="rounded-full px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400 transition-colors"
                                        >
                                            Archive
                                        </button>
                                    </div>
                                ))}
                                {archivedEvents.length > 0 && (
                                    <>
                                        <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 pt-1">
                                            Archived
                                        </p>
                                        {archivedEvents.map((habit) => (
                                            <div
                                                key={habit.id}
                                                className="flex items-center gap-2 opacity-60"
                                            >
                                                <span className="text-sm">
                                                    {habit.emoji}
                                                </span>
                                                <span className="flex-1 text-xs text-stone-500 dark:text-zinc-400 truncate line-through">
                                                    {habit.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        unarchiveHabit(habit.id)
                                                    }
                                                    className="rounded-full px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition-colors"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}

                {panel === 'import' && (
                    <div className="rounded-xl border border-stone-200 dark:border-zinc-700 p-3 space-y-2">
                        <p className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wide">
                            Import Events
                        </p>
                        <div className="space-y-1.5">
                            {importRows.map((row, index) => (
                                <div key={index} className="flex gap-1.5">
                                    <input
                                        value={row}
                                        onChange={(e) =>
                                            updateImportRow(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            index === 0
                                                ? 'Morning walk'
                                                : 'Event name'
                                        }
                                        className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                    />
                                    {importRows.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setImportRows((rows) =>
                                                    rows.filter(
                                                        (_, rowIndex) =>
                                                            rowIndex !== index,
                                                    ),
                                                )
                                            }
                                            className="rounded-lg px-2 text-xs text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                            aria-label="Remove event row"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() =>
                                    setImportRows((rows) => [...rows, ''])
                                }
                                className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400"
                            >
                                + Add event row
                            </button>
                            <label className="cursor-pointer rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:text-zinc-400">
                                Parse from file
                                <input
                                    type="file"
                                    accept=".txt,.csv,.tsv,.md,text/plain,text/csv"
                                    className="sr-only"
                                    onChange={(e) => {
                                        void handleImportFile(
                                            e.target.files?.[0] ?? null,
                                        );
                                        e.currentTarget.value = '';
                                    }}
                                />
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                                Schedule:
                            </span>
                            <div className="flex gap-1">
                                {FREQ_OPTIONS.slice(0, 3).map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setImportFreq(opt.value)}
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                            importFreq === opt.value
                                                ? 'bg-violet-500 text-white'
                                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={importNames.length === 0}
                            onClick={() => {
                                void (async () => {
                                    const created =
                                        await importHabits(importNames);
                                    for (const habit of created) {
                                        setRepeatConfig(habit.id, {
                                            frequency: importFreq,
                                        });
                                    }
                                    setImportRows(['']);
                                    setPanel(null);
                                })();
                            }}
                            className="w-full rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-medium py-1.5 transition-colors"
                        >
                            Import {importNames.length || ''} events
                        </button>
                    </div>
                )}

                {/* View content */}
                {panel === null && view === 'summary' && (
                    <div className="space-y-2">
                        {activeEvents.length === 0 ? (
                            <HabitEmptyState
                                message="No events tracked yet. Create one to start logging."
                                action={{
                                    label: 'New event',
                                    onClick: () => togglePanel('add'),
                                }}
                            />
                        ) : (
                            <>
                                <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 bg-violet-50/80 dark:bg-violet-950/20 p-3">
                                    <p className="text-[10px] font-semibold uppercase text-violet-500 dark:text-violet-300">
                                        Today
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                        {stats.loggedToday}/
                                        {activeEvents.length} logged
                                    </p>
                                    <p className="text-xs text-stone-500 dark:text-zinc-400">
                                        {stats.completionRate === 1
                                            ? 'All events logged today 🎉'
                                            : stats.loggedToday === 0
                                              ? 'Nothing logged yet — tap an event to log it'
                                              : `${activeEvents.length - stats.loggedToday} remaining`}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <StatBox
                                        label="Best streak"
                                        value={`${stats.bestStreak}d`}
                                    />
                                    <StatBox
                                        label="Tracking"
                                        value={String(activeEvents.length)}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
                                        <span>
                                            {stats.topEvent &&
                                            stats.bestStreak > 0
                                                ? `${stats.topEvent.emoji} ${stats.topEvent.name} · ${stats.bestStreak}-day streak`
                                                : 'No active streaks yet'}
                                        </span>
                                        <span>
                                            {Math.round(
                                                stats.completionRate * 100,
                                            )}
                                            %
                                        </span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-stone-100 dark:bg-zinc-800">
                                        <div
                                            className="h-2 rounded-full bg-violet-500 transition-all"
                                            style={{
                                                width: `${stats.completionRate * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {panel === null && view === 'today' && (
                    <ul className="space-y-2">
                        {activeEvents.length === 0 ? (
                            <HabitEmptyState
                                message="No events to log. Create one first."
                                action={{
                                    label: 'New event',
                                    onClick: () => togglePanel('add'),
                                }}
                            />
                        ) : (
                            activeEvents.map((habit) => {
                                const todayCompletion = getCompletionToday(
                                    habit.id,
                                );
                                return (
                                    <HabitListItem
                                        key={habit.id}
                                        habit={habit}
                                        done={!!todayCompletion}
                                        streak={getHabitStreak(habit.id)}
                                        bestStreak={getHabitBestStreak(
                                            habit.id,
                                        )}
                                        days={getLast7Days(habit.id)}
                                        lastCompletedLabel={getHabitLastCompletedLabel(
                                            habit.id,
                                        )}
                                        frequencyLabel={frequencyLabel(
                                            repeatConfigs[habit.id],
                                        )}
                                        completionId={todayCompletion?.id}
                                        completionTime={
                                            todayCompletion?.completed_date
                                        }
                                        onEditTime={updateCompletionTime}
                                        onToggle={() => {
                                            void toggleCompletion(habit.id);
                                        }}
                                        onDelete={() => {
                                            void deleteHabit(habit.id);
                                        }}
                                    />
                                );
                            })
                        )}
                    </ul>
                )}

                {panel === null && view === 'streaks' && (
                    <div className="space-y-1">
                        {sortedByStreak.length === 0 ? (
                            <HabitEmptyState message="No events tracked yet." />
                        ) : (
                            sortedByStreak.map((habit) => {
                                const streak = getHabitStreak(habit.id);
                                const best = getHabitBestStreak(habit.id);
                                return (
                                    <div
                                        key={habit.id}
                                        className="flex items-center gap-2 rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2"
                                    >
                                        <Trophy className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                        <span className="text-base leading-none">
                                            {habit.emoji}
                                        </span>
                                        <p className="flex-1 truncate text-xs font-medium text-stone-800 dark:text-zinc-100">
                                            {habit.name}
                                        </p>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400">
                                                🔥 {streak}d
                                            </span>
                                            {best > streak && (
                                                <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                                                    best {best}d
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {panel === null && view === 'calendar' && (
                    <div className="space-y-2">
                        {activeEvents.length === 0 ? (
                            <HabitEmptyState message="No events to show." />
                        ) : (
                            <>
                                {activeEvents.length > 1 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {activeEvents.map((h, i) => (
                                            <button
                                                key={h.id}
                                                type="button"
                                                onClick={() =>
                                                    setCalHabitIdx(i)
                                                }
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                                                    calHabitIdx === i
                                                        ? 'bg-violet-500 text-white'
                                                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400',
                                                )}
                                            >
                                                {h.emoji} {h.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calMonth === 0) {
                                                setCalMonth(11);
                                                setCalYear((y) => y - 1);
                                            } else setCalMonth((m) => m - 1);
                                        }}
                                        className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCalendarPicker((v) => !v)
                                        }
                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        {MONTH_NAMES[calMonth]} {calYear}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calMonth === 11) {
                                                setCalMonth(0);
                                                setCalYear((y) => y + 1);
                                            } else setCalMonth((m) => m + 1);
                                        }}
                                        className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-400"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {showCalendarPicker && (
                                    <DatePicker
                                        value={new Date(
                                            calYear,
                                            calMonth,
                                            1,
                                        ).toISOString()}
                                        onChange={(iso) => {
                                            const nextDate = new Date(iso);
                                            setCalYear(nextDate.getFullYear());
                                            setCalMonth(nextDate.getMonth());
                                            setShowCalendarPicker(false);
                                        }}
                                        onCancel={() =>
                                            setShowCalendarPicker(false)
                                        }
                                        showQuickActions={false}
                                        saveLabel="Show month"
                                        className="mx-auto"
                                    />
                                )}

                                <div className="grid grid-cols-7 gap-0.5">
                                    {DAY_LABELS.map((d) => (
                                        <div
                                            key={d}
                                            className="text-center text-[9px] font-semibold text-stone-400 dark:text-zinc-500 pb-0.5"
                                        >
                                            {d}
                                        </div>
                                    ))}
                                    {calDays.map((day) => (
                                        <div
                                            key={day.date}
                                            title={`${day.date}: ${day.count} log${day.count !== 1 ? 's' : ''}`}
                                            className={cn(
                                                'aspect-square rounded-sm flex items-center justify-center text-[9px] transition-colors',
                                                intensityClass(
                                                    day.count,
                                                    day.isCurrentMonth,
                                                ),
                                                day.isToday &&
                                                    'ring-1 ring-violet-500',
                                                !day.isCurrentMonth &&
                                                    'opacity-0 pointer-events-none',
                                            )}
                                        >
                                            {day.isCurrentMonth
                                                ? new Date(
                                                      day.date + 'T12:00:00',
                                                  ).getDate()
                                                : ''}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                                        Less
                                    </span>
                                    {[0, 1, 2, 3].map((level) => (
                                        <div
                                            key={level}
                                            className={cn(
                                                'w-3 h-3 rounded-sm',
                                                level === 0 &&
                                                    'bg-stone-100 dark:bg-zinc-800',
                                                level === 1 &&
                                                    'bg-violet-200 dark:bg-violet-900/50',
                                                level === 2 &&
                                                    'bg-violet-400 dark:bg-violet-600',
                                                level === 3 &&
                                                    'bg-violet-600 dark:bg-violet-400',
                                            )}
                                        />
                                    ))}
                                    <span className="text-[9px] text-stone-400 dark:text-zinc-500">
                                        More
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {panel === null && view === 'history' && (
                    <div className="space-y-2">
                        {historyByDate.length === 0 ? (
                            <HabitEmptyState message="No entries logged yet." />
                        ) : (
                            historyByDate.map((group) => (
                                <div key={group.date}>
                                    <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wide mb-1">
                                        {group.date}
                                    </p>
                                    <div className="space-y-0.5 rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                                        {group.entries.map((e, i) => (
                                            <div
                                                key={`${e.habitId}-${i}`}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span className="text-xs">
                                                    {e.emoji}
                                                </span>
                                                <span className="text-xs text-stone-700 dark:text-zinc-300 truncate flex-1">
                                                    {e.name}
                                                </span>
                                                {e.time && (
                                                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 shrink-0">
                                                        {e.time}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-violet-500 shrink-0">
                                                    ✓
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
            <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                {value}
            </p>
        </div>
    );
}
