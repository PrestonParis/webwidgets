'use client';

import { useMemo, useState } from 'react';
import { Dumbbell, History, Repeat2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { useFitnessRoutines } from '@/features/tracking/hooks/useFitnessRoutines';
import {
    computeFitnessAnalytics,
    getWeeklySessions,
} from '@/features/tracking/lib/fitness/analytics';
import {
    calculateFitnessGoalProgress,
    describeFitnessGoal,
    parseFitnessGoal,
} from '@/features/tracking/lib/fitness/goals';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'routines';

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2">
            <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
        </div>
    );
}

export default function WorkoutWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const [showNewRoutine, setShowNewRoutine] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');

    const { entries, refetch } = useTrackingEntries({
        category: 'workout',
        limit: 30,
    });
    const { handleAdd } = useTrackingActions(refetch);
    const { goal } = useTrackingGoals('workout');
    const {
        routines,
        loading: routinesLoading,
        create: createRoutine,
        remove: removeRoutine,
    } = useFitnessRoutines();

    const analytics = useMemo(
        () => computeFitnessAnalytics(entries),
        [entries],
    );
    const weekly = useMemo(
        () => getWeeklySessions(analytics.sessions),
        [analytics.sessions],
    );
    const fitnessGoal = parseFitnessGoal(goal);
    const goalProgress = calculateFitnessGoalProgress(fitnessGoal, weekly);
    const todayKey = new Date().toISOString().slice(0, 10);

    return (
        <WidgetShell
            icon={<Dumbbell className="h-4 w-4 text-orange-500" />}
            title="Workouts"
            footerHref="/tracking"
            footerLabel="Open fitness dashboard"
            widgetId="workout-widget"
            widgetType="tracking-workout"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Workouts"
                />
            }
        >
            <div className="space-y-3">
                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'routines'] as const).map(
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
                                {t === 'routines'
                                    ? 'Routines'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
                    <QuickEntryForm
                        initialCategory="workout"
                        lockCategory
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setTab('history');
                        }}
                        onCancel={() => setTab('history')}
                    />
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={analytics.sessions.map((s) => s.date)}
                            accentColor="orange"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {analytics.sessions.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No workout sessions yet.
                                </p>
                            ) : (
                                analytics.sessions
                                    .slice(0, 10)
                                    .map((session) => (
                                        <div
                                            key={session.id}
                                            className={`flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 ${session.date === todayKey ? 'ring-1 ring-orange-400' : ''}`}
                                        >
                                            <History className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-gray-800 dark:text-zinc-100">
                                                    {session.title}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                                    {formatDate(session.date)} ·{' '}
                                                    {session.durationMinutes}m ·{' '}
                                                    {Math.round(
                                                        session.totalVolume,
                                                    ).toLocaleString()}{' '}
                                                    vol
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <Stat
                                label="This week"
                                value={`${analytics.weeklyWorkoutCount}/${fitnessGoal.targetValue}`}
                            />
                            <Stat
                                label={
                                    analytics.weeklyVolume > 0
                                        ? 'Volume'
                                        : 'Duration'
                                }
                                value={
                                    analytics.weeklyVolume > 0
                                        ? Math.round(
                                              analytics.weeklyVolume,
                                          ).toLocaleString()
                                        : `${analytics.weeklyDuration}m`
                                }
                            />
                            <Stat
                                label="PRs"
                                value={String(analytics.recentPrs.length)}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                                <span>{describeFitnessGoal(fitnessGoal)}</span>
                                <span>{goalProgress.label}</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800">
                                <div
                                    className="h-2 rounded-full bg-orange-500"
                                    style={{
                                        width: `${goalProgress.ratio * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                            {analytics.insights[0] ??
                                'Not enough data for insights yet.'}
                        </p>
                    </div>
                )}

                {tab === 'routines' && (
                    <div className="space-y-3">
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                Save as routine
                            </p>
                            {!showNewRoutine ? (
                                <button
                                    type="button"
                                    onClick={() => setShowNewRoutine(true)}
                                    className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white"
                                >
                                    <Repeat2 className="h-3 w-3" /> Save as
                                    template
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newRoutineName}
                                        onChange={(e) =>
                                            setNewRoutineName(e.target.value)
                                        }
                                        placeholder="Routine name…"
                                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newRoutineName.trim()) return;
                                            const latest =
                                                analytics.sessions[0];
                                            await createRoutine({
                                                name: newRoutineName.trim(),
                                                exercises: [],
                                                tags: latest
                                                    ? [latest.workoutType]
                                                    : [],
                                                ...(latest?.durationMinutes
                                                    ? {
                                                          duration_minutes:
                                                              latest.durationMinutes,
                                                      }
                                                    : {}),
                                            });
                                            setNewRoutineName('');
                                            setShowNewRoutine(false);
                                        }}
                                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewRoutine(false);
                                            setNewRoutineName('');
                                        }}
                                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                                Saved routines ({routines.length})
                            </p>
                            {routinesLoading ? (
                                <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                            ) : routines.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No routines saved yet. Log a workout and
                                    save it as a template.
                                </p>
                            ) : (
                                routines.slice(0, 6).map((routine) => (
                                    <div
                                        key={routine.id}
                                        className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium text-gray-800 dark:text-zinc-100">
                                                {routine.name}
                                            </p>
                                            {routine.duration_minutes !==
                                                undefined && (
                                                <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                                    {routine.duration_minutes}
                                                    min
                                                    {routine.tags.length > 0
                                                        ? ` · ${routine.tags.join(', ')}`
                                                        : ''}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void removeRoutine(routine.id)
                                            }
                                            className="shrink-0 text-[10px] text-zinc-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
