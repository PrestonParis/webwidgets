'use client';

import { useMemo, useState } from 'react';
import { BookMarked, ClipboardList, Import, Plus, Repeat2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useHabitWidgetData } from '@/features/habit/hooks/useHabitWidgetData';
import { useHabitForm } from '@/features/habit/hooks/useHabitForm';
import HabitListItem from '@/features/habit/components/HabitListItem';
import HabitAddForm from '@/features/habit/components/HabitAddForm';
import HabitEmptyState from '@/features/habit/components/HabitEmptyState';
import { HabitRepeatPanel } from '@/features/habit/components/HabitRepeatPanel';
import { HabitArchivePanel } from '@/features/habit/components/HabitArchivePanel';
import { HabitImportPanel } from '@/features/habit/components/HabitImportPanel';
import { HabitCalendarView } from '@/features/habit/components/HabitCalendarView';
import { HabitStreaksView } from '@/features/habit/components/HabitStreaksView';
import { HabitHistoryView } from '@/features/habit/components/HabitHistoryView';
import { frequencyLabel } from '@/features/habit/lib/habitUtils';
import type { HabitFrequency } from '@/features/habit/types/habit';
import { cn } from '@/lib/utils/utils';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';

type View = 'summary' | 'today' | 'streaks' | 'calendar' | 'history';
type Panel = null | 'add' | 'repeat' | 'archive' | 'import';

function formatHistoryTime(isoStr: string): string {
    if (!isoStr.includes('T')) return '';
    return new Date(isoStr).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    });
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

export default function HabitWidget() {
    const [view, setView] = useState<View>('summary');
    const [panel, setPanel] = useState<Panel>(null);
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
    function switchView(v: View) {
        setView(v);
        setPanel(null);
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

    const tabCls = (active: boolean) =>
        cn(
            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
            active
                ? 'bg-violet-600 text-white'
                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
        );
    const panelTabCls = (active: boolean) =>
        cn(
            'flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition-colors',
            active
                ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-violet-300',
        );

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
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="habits"
                    displayName="Habits"
                />
            }
        >
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                    <button
                        type="button"
                        onClick={() => switchView('summary')}
                        className={tabCls(panel === null && view === 'summary')}
                    >
                        Summary
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('add')}
                        className={tabCls(panel === 'add')}
                    >
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('today')}
                        className={tabCls(panel === null && view === 'today')}
                    >
                        Log
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('repeat')}
                        className={panelTabCls(panel === 'repeat')}
                    >
                        <Repeat2 className="h-3 w-3" /> Schedule
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('calendar')}
                        className={tabCls(
                            panel === null && view === 'calendar',
                        )}
                    >
                        Calendar
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('streaks')}
                        className={tabCls(panel === null && view === 'streaks')}
                    >
                        Streaks
                    </button>
                    <button
                        type="button"
                        onClick={() => switchView('history')}
                        className={tabCls(panel === null && view === 'history')}
                    >
                        History
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('archive')}
                        className={panelTabCls(panel === 'archive')}
                    >
                        <BookMarked className="h-3 w-3" /> Archive
                    </button>
                    <button
                        type="button"
                        onClick={() => togglePanel('import')}
                        className={panelTabCls(panel === 'import')}
                    >
                        <Import className="h-3 w-3" /> Import
                    </button>
                </div>

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
                    <HabitRepeatPanel
                        activeEvents={activeEvents}
                        repeatConfigs={repeatConfigs}
                        setRepeatConfig={setRepeatConfig}
                    />
                )}
                {panel === 'archive' && (
                    <HabitArchivePanel
                        habits={habits}
                        activeEvents={activeEvents}
                        archivedEvents={archivedEvents}
                        archiveHabit={archiveHabit}
                        unarchiveHabit={unarchiveHabit}
                    />
                )}
                {panel === 'import' && (
                    <HabitImportPanel
                        importHabits={importHabits}
                        setRepeatConfig={setRepeatConfig}
                        onDone={() => setPanel(null)}
                    />
                )}

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
                                        {...(todayCompletion?.id !== undefined
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
                )}

                {panel === null && view === 'streaks' && (
                    <HabitStreaksView
                        sortedByStreak={sortedByStreak}
                        getHabitStreak={getHabitStreak}
                        getHabitBestStreak={getHabitBestStreak}
                    />
                )}
                {panel === null && view === 'calendar' && (
                    <HabitCalendarView
                        activeEvents={activeEvents}
                        getCalendarMonth={getCalendarMonth}
                    />
                )}
                {panel === null && view === 'history' && (
                    <HabitHistoryView historyByDate={historyByDate} />
                )}
            </div>
        </WidgetShell>
    );
}
