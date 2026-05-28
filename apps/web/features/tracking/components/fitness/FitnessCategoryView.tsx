'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Copy,
    Download,
    FileUp,
    Plus,
    Search,
    Star,
    Target,
    Trophy,
} from 'lucide-react';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import {
    computeFitnessAnalytics,
    getWeeklySessions,
} from '@/features/tracking/lib/fitness/analytics';
import {
    calculateFitnessGoalProgress,
    describeFitnessGoal,
    parseFitnessGoal,
} from '@/features/tracking/lib/fitness/goals';
import { localExerciseLibraryProvider } from '@/features/tracking/lib/fitness/providers/exerciseLibraryProvider';
import { wearableProviders } from '@/features/tracking/lib/fitness/providers/wearableProvider';
import { fitnessFeatureFlags } from '@/features/tracking/lib/fitness/featureFlags';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/trackingEntryTypes';
import type { ExerciseDefinition } from '@/features/tracking/lib/fitness/types';

interface FitnessCategoryViewProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

const sectionCls =
    'rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';

function Kpi({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3">
            <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
            {sub && (
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {sub}
                </p>
            )}
        </div>
    );
}

export function FitnessCategoryView({
    entries,
    onAdd,
    onEdit,
    onDelete,
}: FitnessCategoryViewProps) {
    const [showLogger, setShowLogger] = useState(false);
    const [exerciseQuery, setExerciseQuery] = useState('');
    const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
    const analytics = useMemo(
        () => computeFitnessAnalytics(entries),
        [entries],
    );
    const weekly = useMemo(
        () => getWeeklySessions(analytics.sessions),
        [analytics.sessions],
    );
    const { goal } = useTrackingGoals('workout');
    const fitnessGoal = parseFitnessGoal(goal);
    const goalProgress = calculateFitnessGoalProgress(fitnessGoal, weekly);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            void localExerciseLibraryProvider
                .search({ query: exerciseQuery, limit: 8 })
                .then(setExercises);
        }, 200);
        return () => window.clearTimeout(handle);
    }, [exerciseQuery]);

    return (
        <div className="space-y-4">
            <div className={sectionCls}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase text-orange-500 dark:text-orange-300">
                            Fitness dashboard
                        </p>
                        <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-zinc-100">
                            {analytics.latestWorkout?.title ??
                                'Ready for your first workout'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            {analytics.latestWorkout
                                ? `${formatDate(analytics.latestWorkout.date)} · ${analytics.latestWorkout.durationMinutes} minutes`
                                : 'Log a workout, create a routine, or connect an import source.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setShowLogger((v) => !v)}
                            className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white"
                        >
                            <Plus className="h-3.5 w-3.5" /> Log workout
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-200"
                        >
                            <Activity className="h-3.5 w-3.5" /> Start workout
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    <Kpi
                        label="Weekly workouts"
                        value={`${analytics.weeklyWorkoutCount}/${fitnessGoal.targetValue}`}
                        sub={describeFitnessGoal(fitnessGoal)}
                    />
                    <Kpi
                        label="Duration"
                        value={`${analytics.weeklyDuration}m`}
                        sub="This week"
                    />
                    <Kpi
                        label="Volume"
                        value={Math.round(
                            analytics.weeklyVolume,
                        ).toLocaleString()}
                        sub="This week"
                    />
                    <Kpi
                        label="Distance"
                        value={
                            Math.round(analytics.weeklyDistance * 10) / 10 + ''
                        }
                        sub="This week"
                    />
                    <Kpi
                        label="Recent PRs"
                        value={String(analytics.recentPrs.length)}
                        sub="Last 30 days"
                    />
                </div>
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400">
                        <span>Goal progress</span>
                        <span>{goalProgress.label}</span>
                    </div>
                    <div
                        className="mt-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-800"
                        aria-label={`Goal progress ${Math.round(goalProgress.ratio * 100)} percent`}
                    >
                        <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{ width: `${goalProgress.ratio * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {showLogger && (
                <div className={sectionCls}>
                    <QuickEntryForm
                        initialCategory="workout"
                        lockCategory
                        onSubmit={async (entry) => {
                            await onAdd(entry);
                            setShowLogger(false);
                        }}
                        onCancel={() => setShowLogger(false)}
                    />
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <section className={sectionCls}>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Recent history
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            Newest first
                        </span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {analytics.sessions.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No workout history yet.
                            </p>
                        )}
                        {analytics.sessions.slice(0, 12).map((session) => (
                            <div
                                key={session.id}
                                className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                            {session.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            {formatDate(session.date)} ·{' '}
                                            {session.workoutType} ·{' '}
                                            {session.durationMinutes}m ·{' '}
                                            {session.exercises.length} exercises
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {session.rawEntry && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEdit(session.rawEntry!)
                                                }
                                                className="text-xs text-indigo-500"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onDelete(session.id)}
                                            className="text-xs text-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-600 dark:text-zinc-300">
                                    {Math.round(
                                        session.totalVolume,
                                    ).toLocaleString()}{' '}
                                    volume · {session.totalSets} sets ·{' '}
                                    {session.totalReps} reps
                                    {analytics.prs.some(
                                        (pr) => pr.workoutId === session.id,
                                    )
                                        ? ' · PR'
                                        : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={sectionCls}>
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Routines/templates
                        </h3>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-left"
                        >
                            <span>Create routine</span>
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-left"
                        >
                            <span>Repeat last workout</span>
                            <Copy className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            Template persistence is scaffolded behind
                            `fitnessWorkoutRoutines`; completed workouts can be
                            converted through the domain layer.
                        </p>
                    </div>
                </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <section className={sectionCls}>
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-orange-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Exercise library
                        </h3>
                    </div>
                    <label
                        htmlFor="exercise-library-search"
                        className="mt-3 block text-xs font-medium text-gray-500 dark:text-zinc-400"
                    >
                        Search exercises
                    </label>
                    <input
                        id="exercise-library-search"
                        value={exerciseQuery}
                        onChange={(e) => setExerciseQuery(e.target.value)}
                        placeholder="Bench, legs, barbell..."
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {exercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                        {exercise.name}
                                    </p>
                                    <button
                                        type="button"
                                        aria-label={`Favorite ${exercise.name}`}
                                        className="text-gray-400"
                                    >
                                        <Star className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {exercise.primaryMuscles.join(', ')} ·{' '}
                                    {exercise.equipment.join(', ')}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={sectionCls}>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-orange-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            PRs and progression
                        </h3>
                    </div>
                    <div className="mt-3 space-y-2">
                        {analytics.prs.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No PRs yet. Log valid sets with reps and weight
                                to detect new bests.
                            </p>
                        )}
                        {analytics.prs.slice(0, 8).map((pr) => (
                            <div
                                key={pr.id}
                                className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-3"
                            >
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {pr.exerciseName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {pr.type.replaceAll('_', ' ')} ·{' '}
                                    {Math.round(pr.value * 10) / 10} {pr.unit} ·{' '}
                                    {formatDate(pr.date)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Trends and muscle distribution
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                        {analytics.sessions.length < 2 ? (
                            <p>Not enough data yet.</p>
                        ) : (
                            analytics.insights.map((insight) => (
                                <p key={insight}>{insight}</p>
                            ))
                        )}
                        {Object.entries(analytics.muscleGroupFrequency)
                            .slice(0, 6)
                            .map(([muscle, count]) => (
                                <div
                                    key={muscle}
                                    className="flex justify-between text-xs"
                                >
                                    <span>{muscle}</span>
                                    <span>{count} sessions</span>
                                </div>
                            ))}
                    </div>
                </section>
                <section className="xl:col-span-1">
                    <GoalSettingsPanel category="workout" />
                </section>
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Imports and exports
                    </h3>
                    <div className="mt-3 space-y-2">
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-sm text-gray-700 dark:text-zinc-200"
                        >
                            <FileUp className="h-4 w-4" /> Preview CSV import
                        </button>
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-sm text-gray-700 dark:text-zinc-200"
                        >
                            <Download className="h-4 w-4" /> Export history CSV
                        </button>
                        <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                            {fitnessFeatureFlags.fitnessWearableImports &&
                                wearableProviders
                                    .slice(0, 4)
                                    .map((provider) => (
                                        <p key={provider.id}>
                                            {provider.label}:{' '}
                                            {provider.configured
                                                ? 'Ready'
                                                : 'Needs setup'}
                                        </p>
                                    ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
