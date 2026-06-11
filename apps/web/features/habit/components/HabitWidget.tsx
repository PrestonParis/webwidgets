'use client';

import { useMemo, useState } from 'react';
import { BookMarked, ClipboardList, Import, Plus } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useHabitWidgetData } from '@/features/habit/hooks/useHabitWidgetData';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';
import HabitEmptyState from '@/features/habit/components/HabitEmptyState';
import { HabitArchivePanel } from '@/features/habit/components/HabitArchivePanel';
import { HabitImportPanel } from '@/features/habit/components/HabitImportPanel';
import { HabitCalendarView } from '@/features/habit/components/HabitCalendarView';
import { HabitStreaksView } from '@/features/habit/components/HabitStreaksView';
import { HabitHistoryView } from '@/features/habit/components/HabitHistoryView';
import { HabitRepeatPanel } from '@/features/habit/components/HabitRepeatPanel';
import { frequencyLabel } from '@/features/habit/lib/habitUtils';
import type { HabitFrequency } from '@/features/habit/types/habit';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'streaks';
type Panel = null | 'add' | 'repeat' | 'archive' | 'import';

function formatHistoryTime(isoStr: string): string {
    if (!isoStr.includes('T')) return '';
    return new Date(isoStr).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function HabitWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const [panel, setPanel] = useState<Panel>(null);
    const [showArchive, setShowArchive] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);
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
    } = useHabitWidgetData();
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
                footerHref="/tracking"
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
            footerHref="/tracking"
            footerLabel="Open logging dashboard"
            widgetId="habit-widget"
            widgetType="habit"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="habits"
                    displayName="Habits"
                />
            }
        >
            <div className="space-y-3">
                {/* Tab bar */}
                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'streaks'] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                                    tab === t
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {t === 'streaks'
                                    ? 'Streaks'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
                    <div className="space-y-3">
                        {/* Today's habit log */}
                        <ul className="space-y-2">
                            {activeEvents.length === 0 ? (
                                <HabitEmptyState
                                    message="No events tracked yet. Create one to start logging."
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
                                            {...(todayCompletion?.id !==
                                            undefined
                                                ? {
                                                      completionId:
                                                          todayCompletion.id,
                                                  }
                                                : {})}
                                            {...(todayCompletion?.completed_date !==
                                            undefined
                                                ? {
                                                      completionTime:
                                                          todayCompletion.completed_date,
                                                  }
                                                : {})}
                                            onEditTime={(id, value) => {
                                                void updateCompletionTime(
                                                    id,
                                                    value,
                                                );
                                            }}
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

                        {/* New habit form */}
                        {panel === 'add' ? (
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
                        ) : (
                            <button
                                type="button"
                                onClick={() => togglePanel('add')}
                                className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400"
                            >
                                <Plus className="h-3 w-3" /> New habit
                            </button>
                        )}

                        {/* Import button */}
                        {panel === 'import' ? (
                            <HabitImportPanel
                                importHabits={importHabits}
                                setRepeatConfig={setRepeatConfig}
                                onDone={() => setPanel(null)}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => togglePanel('import')}
                                className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500"
                            >
                                <Import className="h-3 w-3" /> Import habits
                            </button>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={completions.map((c) =>
                                c.completed_date.slice(0, 10),
                            )}
                            accentColor="violet"
                        />
                        <HabitHistoryView historyByDate={historyByDate} />
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                                <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                                    Logged today
                                </p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                    {stats.loggedToday}/{activeEvents.length}
                                </p>
                            </div>
                            <div className="rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                                <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                                    Best streak
                                </p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                    {stats.bestStreak}d
                                </p>
                            </div>
                            <div className="rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                                <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                                    Completion
                                </p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                    {Math.round(stats.completionRate * 100)}%
                                </p>
                            </div>
                            <div className="rounded-lg bg-stone-50 dark:bg-zinc-800/70 p-2">
                                <p className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                                    Tracking
                                </p>
                                <p className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                                    {activeEvents.length}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400">
                                <span>
                                    {stats.topEvent && stats.bestStreak > 0
                                        ? `${stats.topEvent.emoji} ${stats.topEvent.name} · ${stats.bestStreak}-day streak`
                                        : 'No active streaks yet'}
                                </span>
                                <span>
                                    {Math.round(stats.completionRate * 100)}%
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
                    </div>
                )}

                {tab === 'streaks' && (
                    <div className="space-y-3">
                        <HabitStreaksView
                            sortedByStreak={sortedByStreak}
                            getHabitStreak={getHabitStreak}
                            getHabitBestStreak={getHabitBestStreak}
                        />
                        <HabitCalendarView
                            activeEvents={activeEvents}
                            getCalendarMonth={getCalendarMonth}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowArchive((v) => !v)}
                                className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500"
                            >
                                <BookMarked className="h-3 w-3" /> Archive
                            </button>
                        </div>
                        {showArchive && (
                            <HabitArchivePanel
                                habits={habits}
                                activeEvents={activeEvents}
                                archivedEvents={archivedEvents}
                                archiveHabit={archiveHabit}
                                unarchiveHabit={unarchiveHabit}
                            />
                        )}
                        {showRepeat && (
                            <HabitRepeatPanel
                                activeEvents={activeEvents}
                                repeatConfigs={repeatConfigs}
                                setRepeatConfig={setRepeatConfig}
                            />
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
