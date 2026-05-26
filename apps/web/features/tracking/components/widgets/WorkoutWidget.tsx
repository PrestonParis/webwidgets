'use client';

import { useMemo, useState } from 'react';
import {
    Activity,
    BarChart3,
    Dumbbell,
    History,
    Import,
    Plus,
    Repeat2,
    Search,
    Target,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { QuickActionButton } from '@/features/tracking/components/TrackingSurface';
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

type ViewMode =
    | 'log'
    | 'active'
    | 'repeat'
    | 'routine'
    | 'exercise'
    | 'import'
    | 'history'
    | 'trends'
    | 'summary';

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
    const [mode, setMode] = useState<ViewMode>('log');
    const { entries, refetch } = useTrackingEntries({
        category: 'workout',
        limit: 30,
    });
    const { handleAdd } = useTrackingActions(refetch);
    const { goal } = useTrackingGoals('workout');
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
    const latest = analytics.latestWorkout;

    return (
        <WidgetShell
            icon={<Dumbbell className="h-4 w-4 text-orange-500" />}
            title="Workouts"
            footerHref="/tracking"
            footerLabel="Open fitness dashboard"
            widgetId="workout-widget"
            widgetType="tracking-workout"
        >
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'log'}
                        onClick={() => setMode('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'active'}
                        onClick={() => setMode('active')}
                    >
                        <Activity className="h-3 w-3" /> Start
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'repeat'}
                        onClick={() => setMode('repeat')}
                    >
                        <Repeat2 className="h-3 w-3" /> Repeat
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'routine'}
                        onClick={() => setMode('routine')}
                    >
                        <Target className="h-3 w-3" /> Routine
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'exercise'}
                        onClick={() => setMode('exercise')}
                    >
                        <Search className="h-3 w-3" /> Exercise
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'import'}
                        onClick={() => setMode('import')}
                    >
                        <Import className="h-3 w-3" /> Import
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'history'}
                        onClick={() => setMode('history')}
                    >
                        <History className="h-3 w-3" /> History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'trends'}
                        onClick={() => setMode('trends')}
                    >
                        <BarChart3 className="h-3 w-3" /> Trends
                    </QuickActionButton>
                    <QuickActionButton
                        tone="orange"
                        primary={mode === 'summary'}
                        onClick={() => setMode('summary')}
                    >
                        <Dumbbell className="h-3 w-3" /> Summary
                    </QuickActionButton>
                </div>

                {mode === 'log' && (
                    <QuickEntryForm
                        initialCategory="workout"
                        lockCategory
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setMode('summary');
                        }}
                        onCancel={() => setMode('summary')}
                    />
                )}

                {mode === 'summary' && (
                    <div className="space-y-3">
                        {latest ? (
                            <div className="rounded-xl border border-orange-100 dark:border-orange-900/50 bg-orange-50/80 dark:bg-orange-950/20 p-3">
                                <p className="text-[10px] font-semibold uppercase text-orange-500 dark:text-orange-300">
                                    Latest workout
                                </p>
                                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {latest.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {formatDate(latest.date)} ·{' '}
                                    {latest.durationMinutes || 'No'} min ·{' '}
                                    {latest.totalSets} sets
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-orange-200 dark:border-orange-900 p-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Log your first workout
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Create a routine, set a weekly goal, or
                                    import from a wearable/app.
                                </p>
                            </div>
                        )}
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
                                label="Recent PRs"
                                value={String(analytics.recentPrs.length)}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                                <span>{describeFitnessGoal(fitnessGoal)}</span>
                                <span>{goalProgress.label}</span>
                            </div>
                            <div
                                className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                                aria-label={`Weekly goal progress ${Math.round(goalProgress.ratio * 100)} percent`}
                            >
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
                {mode === 'active' && (
                    <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        <p className="font-medium text-gray-800 dark:text-zinc-100">
                            No active workout running.
                        </p>
                        <p>
                            Rest timer and live wearable sync are scaffolded for
                            provider support.
                        </p>
                    </div>
                )}
                {mode === 'history' && (
                    <div className="space-y-1">
                        {analytics.sessions.slice(0, 5).map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2"
                            >
                                <History className="h-3.5 w-3.5 text-gray-400" />
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
                                        volume
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {mode === 'trends' && (
                    <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-zinc-100">
                            <BarChart3 className="h-3.5 w-3.5" /> Trends
                        </div>
                        {analytics.sessions.length < 2
                            ? 'Not enough data yet.'
                            : `Weekly volume: ${Math.round(analytics.weeklyVolume).toLocaleString()} · duration: ${analytics.weeklyDuration}m · PRs: ${analytics.recentPrs.length}`}
                    </div>
                )}
                {mode === 'repeat' && (
                    <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        Repeat-last-workout templates will appear here once
                        routines are saved.
                    </p>
                )}
                {mode === 'routine' && (
                    <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        Routine builder is available from the full fitness
                        dashboard.
                    </p>
                )}
                {mode === 'exercise' && (
                    <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        Exercise search is available from the full fitness
                        dashboard.
                    </p>
                )}
                {mode === 'import' && (
                    <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        Import workouts from supported providers in the full
                        dashboard.
                    </p>
                )}
            </div>
        </WidgetShell>
    );
}
