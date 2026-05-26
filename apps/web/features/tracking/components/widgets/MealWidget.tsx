'use client';

import { useState, useMemo } from 'react';
import {
    BarChart3,
    Plus,
    Repeat2,
    ScanBarcode,
    Search,
    Target,
    Utensils,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { MealGoalPanel } from '@/features/tracking/components/MealGoalPanel';
import {
    QuickActionButton,
    WidgetStat,
} from '@/features/tracking/components/TrackingSurface';
import {
    normalizeMealEntries,
    computeMealAnalytics,
    extractMealGoalConfig,
    calorieStatus,
    calorieStatusLabel,
    buildDailySummary,
    groupByMealType,
    formatMealTime,
    mealRecordSummary,
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ICONS,
    MEAL_TYPE_ORDER,
    type MealViewMode,
    type MealRecord,
} from '@/features/tracking/lib/meal/mealDomain';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { BarcodeModal } from '@/features/tracking/components/meal/BarcodeModal';
import { foodResultToMealMetadata } from '@/features/tracking/lib/meal/nutrition/normalize';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import { BarChart } from '@/features/tracking/viz/BarChart';
import { LineChart } from '@/features/tracking/viz/LineChart';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── sub-components ────────────────────────────────────────────────────────────

function GoalProgressBar({
    label,
    value,
    target,
    color = 'green',
}: {
    label: string;
    value: number;
    target: number;
    color?: 'green' | 'blue';
}) {
    const pct = Math.min(100, Math.round((value / target) * 100));
    const barColor = color === 'green' ? 'bg-green-500' : 'bg-blue-500';
    return (
        <div>
            <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                    {label}
                </span>
                <span className="text-[10px] font-medium text-gray-700 dark:text-zinc-300">
                    {Math.round(value)}/{target}
                    <span className="text-gray-400 dark:text-zinc-500 ml-0.5">
                        ({pct}%)
                    </span>
                </span>
            </div>
            <div
                className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${pct}%`}
            >
                <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function MealCard({ record }: { record: MealRecord }) {
    const icon = record.mealType ? MEAL_TYPE_ICONS[record.mealType] : '🍽️';
    return (
        <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5">
            <span className="text-sm shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
                    {record.title ??
                        (record.mealType
                            ? MEAL_TYPE_LABELS[record.mealType]
                            : 'Meal')}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                    {[
                        record.calories !== null
                            ? `${Math.round(record.calories)} kcal`
                            : null,
                        record.proteinGrams !== null
                            ? `${Math.round(record.proteinGrams)}g protein`
                            : null,
                        formatMealTime(record) || null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>
        </div>
    );
}

function EmptyMealsState({
    onLog,
    onGoal,
}: {
    onLog: () => void;
    onGoal: () => void;
}) {
    return (
        <div className="text-center py-6 space-y-3">
            <p className="text-2xl">🍽️</p>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
                No meals logged yet
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Start tracking your nutrition
            </p>
            <div className="flex gap-2 justify-center">
                <button
                    type="button"
                    onClick={onLog}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                    Log your first meal
                </button>
                <button
                    type="button"
                    onClick={onGoal}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-green-300 hover:text-green-500 transition-colors"
                >
                    Set nutrition goals
                </button>
            </div>
        </div>
    );
}

// ─── view tabs ─────────────────────────────────────────────────────────────────

type MealWidgetView =
    | MealViewMode
    | 'log'
    | 'scan'
    | 'repeat'
    | 'goal'
    | 'saved';

// ─── Summary view ──────────────────────────────────────────────────────────────

function SummaryView({
    records,
    calorieTarget,
    proteinMin,
    onLog,
    onGoal,
}: {
    records: MealRecord[];
    calorieTarget: number | null;
    proteinMin: number | null;
    onLog: () => void;
    onGoal: () => void;
}) {
    const today = todayKey();
    const todayRecords = records.filter((r) => r.date === today);
    const todayCals = todayRecords.reduce((s, r) => s + (r.calories ?? 0), 0);
    const todayProtein = todayRecords.reduce(
        (s, r) => s + (r.proteinGrams ?? 0),
        0,
    );
    const status = calorieStatus(todayCals, calorieTarget);
    const statusColors: Record<typeof status, string> = {
        on_track: 'text-green-600 dark:text-green-400',
        under_target: 'text-yellow-500 dark:text-yellow-400',
        over_target: 'text-red-500 dark:text-red-400',
        no_goal: 'text-gray-400 dark:text-zinc-500',
    };

    if (records.length === 0) {
        return <EmptyMealsState onLog={onLog} onGoal={onGoal} />;
    }

    return (
        <div className="space-y-3">
            {/* Today stats row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                        {todayRecords.length}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        Meals today
                    </p>
                </div>
                {todayCals > 0 && (
                    <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {Math.round(todayCals)}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Calories
                        </p>
                    </div>
                )}
                {todayProtein > 0 && (
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-500 dark:text-blue-400">
                            {Math.round(todayProtein)}g
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Protein
                        </p>
                    </div>
                )}
            </div>

            {/* Status badge */}
            <p className={`text-xs font-medium ${statusColors[status]}`}>
                {calorieStatusLabel(status)}
                {status !== 'no_goal' &&
                    todayCals > 0 &&
                    ` · ${Math.round(todayCals)} kcal`}
            </p>

            {/* Goal progress bars */}
            {calorieTarget !== null && todayCals > 0 && (
                <GoalProgressBar
                    label="Calories"
                    value={todayCals}
                    target={calorieTarget}
                    color="green"
                />
            )}
            {proteinMin !== null && todayProtein > 0 && (
                <GoalProgressBar
                    label="Protein"
                    value={todayProtein}
                    target={proteinMin}
                    color="blue"
                />
            )}

            {/* Latest meal */}
            {records[0] && (
                <div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-1">
                        Latest · {formatDate(records[0].date)}
                    </p>
                    <MealCard record={records[0]} />
                </div>
            )}
        </div>
    );
}

// ─── Today view ────────────────────────────────────────────────────────────────

function TodayView({
    records,
    onEdit,
    onDelete,
}: {
    records: MealRecord[];
    onEdit: (r: MealRecord) => void;
    onDelete: (id: string) => void;
}) {
    const today = todayKey();
    const todayRecords = records.filter((r) => r.date === today);
    const grouped = useMemo(
        () => groupByMealType(todayRecords),
        [todayRecords],
    );

    if (todayRecords.length === 0) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                Nothing logged today.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {MEAL_TYPE_ORDER.filter((t) => grouped[t].length > 0).map(
                (mealType) => (
                    <div key={mealType}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1">
                            {MEAL_TYPE_ICONS[mealType]}{' '}
                            {MEAL_TYPE_LABELS[mealType]}
                        </p>
                        <div className="space-y-1">
                            {grouped[mealType].map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-green-800 dark:text-green-200 truncate">
                                            {r.title ??
                                                MEAL_TYPE_LABELS[mealType]}
                                        </p>
                                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                                            {[
                                                r.calories !== null
                                                    ? `${Math.round(r.calories)} kcal`
                                                    : null,
                                                r.proteinGrams !== null
                                                    ? `${Math.round(r.proteinGrams)}g protein`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(r)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-600"
                                            aria-label={`Edit ${r.title ?? mealType}`}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(r.id)}
                                            className="text-[10px] text-red-400 hover:text-red-600"
                                            aria-label={`Delete ${r.title ?? mealType}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ),
            )}
        </div>
    );
}

// ─── History view ──────────────────────────────────────────────────────────────

function HistoryView({
    records,
    onEdit,
    onDelete,
}: {
    records: MealRecord[];
    onEdit: (r: MealRecord) => void;
    onDelete: (id: string) => void;
}) {
    if (records.length === 0) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                No meal history yet.
            </p>
        );
    }

    // Group newest-first by date
    const byDate = new Map<string, MealRecord[]>();
    for (const r of records) {
        const list = byDate.get(r.date) ?? [];
        list.push(r);
        byDate.set(r.date, list);
    }

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {Array.from(byDate.entries()).map(([date, dayRecords]) => (
                <div key={date}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1 sticky top-0 bg-white dark:bg-zinc-900 py-0.5">
                        {formatDate(date)}
                    </p>
                    <div className="space-y-1">
                        {dayRecords.map((r) => (
                            <div
                                key={r.id}
                                className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                            >
                                <span className="text-sm shrink-0">
                                    {r.mealType
                                        ? MEAL_TYPE_ICONS[r.mealType]
                                        : '🍽️'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                                        {r.title ??
                                            (r.mealType
                                                ? MEAL_TYPE_LABELS[r.mealType]
                                                : 'Meal')}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {[
                                            r.calories !== null
                                                ? `${Math.round(r.calories)} kcal`
                                                : null,
                                            r.proteinGrams !== null
                                                ? `${Math.round(r.proteinGrams)}g protein`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(r)}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-600"
                                        aria-label={`Edit ${r.title ?? 'meal'}`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(r.id)}
                                        className="text-[10px] text-red-400 hover:text-red-600"
                                        aria-label={`Delete ${r.title ?? 'meal'}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Trends view ───────────────────────────────────────────────────────────────

function TrendsView({
    records,
    calorieTarget,
    proteinMin,
}: {
    records: MealRecord[];
    calorieTarget: number | null;
    proteinMin: number | null;
}) {
    if (records.length < 3) {
        return (
            <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                Log at least 3 meals to see trends.
            </p>
        );
    }

    // Build 7-day calorie bar chart data
    const barData = useMemo(() => {
        const days: { label: string; value: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en-US', {
                weekday: 'short',
            });
            const total = records
                .filter((r) => r.date === key)
                .reduce((s, r) => s + (r.calories ?? 0), 0);
            days.push({ label, value: total });
        }
        return days;
    }, [records]);

    const analytics = useMemo(
        () =>
            computeMealAnalytics(records, {
                calorieTarget,
                proteinMin,
            }),
        [records, calorieTarget, proteinMin],
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        7-day avg calories
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-0.5">
                        {analytics.sevenDayAvgCalories !== null
                            ? `${Math.round(analytics.sevenDayAvgCalories)} kcal`
                            : '—'}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        7-day avg protein
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 mt-0.5">
                        {analytics.sevenDayAvgProtein !== null
                            ? `${Math.round(analytics.sevenDayAvgProtein)}g`
                            : '—'}
                    </p>
                </div>
            </div>

            {analytics.goalCalorieHitRate7d !== null && (
                <div className="text-xs text-gray-600 dark:text-zinc-400">
                    Hit calorie goal{' '}
                    <span className="font-semibold text-green-500">
                        {Math.round(analytics.goalCalorieHitRate7d * 100)}%
                    </span>{' '}
                    of days this week
                </div>
            )}

            <div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-2">
                    Calories — last 7 days
                </p>
                <BarChart
                    data={barData.filter((d) => d.value > 0)}
                    color="#22c55e"
                    height={120}
                    emptyMessage="No calorie data yet"
                />
            </div>
        </div>
    );
}

// ─── main widget ───────────────────────────────────────────────────────────────

export default function MealWidget() {
    const [activeView, setActiveView] = useState<MealWidgetView>('log');
    const [editRecord, setEditRecord] = useState<MealRecord | null>(null);
    const [showBarcode, setShowBarcode] = useState(false);

    const { entries, refetch } = useTrackingEntries({
        category: 'meal',
        limit: 100,
    });
    const { handleAdd, handleUpdate, handleDelete } =
        useTrackingActions(refetch);
    const { allGoals } = useTrackingGoals('meal');

    const records = useMemo(() => normalizeMealEntries(entries), [entries]);
    const goalConfig = useMemo(
        () => extractMealGoalConfig(allGoals),
        [allGoals],
    );

    const { calorieTarget, proteinMin } = goalConfig;

    const handleEdit = (r: MealRecord) => {
        setEditRecord(r);
        setActiveView('log');
    };

    const handleDeleteMeal = (id: string) => {
        void handleDelete(id);
    };

    const editPayload = editRecord
        ? {
              id: editRecord.id,
              metadata: editRecord.raw.metadata,
              entryDate: editRecord.date,
              ...(editRecord.notes !== null && { notes: editRecord.notes }),
          }
        : undefined;

    const handleRepeatLast = async () => {
        const last = records[0];
        if (!last) return;
        await handleAdd({
            category: 'meal',
            entryDate: todayKey(),
            metadata: { ...last.raw.metadata },
            tags: last.raw.tags ?? [],
            source: 'manual',
            ...(last.raw.notes !== undefined && { notes: last.raw.notes }),
        });
    };

    return (
        <WidgetShell
            icon={<Utensils className="h-4 w-4 text-green-600" />}
            title="Meals"
            footerHref="/tracking"
            footerLabel="Open nutrition dashboard"
            widgetId="meal-widget"
            widgetType="tracking-meal"
        >
            <div className="space-y-3">
                {records[0] ? (
                    <div className="rounded-xl border border-green-100 bg-green-50/80 p-3 dark:border-green-900/50 dark:bg-green-950/20">
                        <p className="text-[10px] font-semibold uppercase text-green-600 dark:text-green-400">
                            Latest meal
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {records[0].title ?? 'Meal'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {formatDate(records[0].date)} ·{' '}
                            {mealRecordSummary(records[0])}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-green-200 p-3 dark:border-green-900">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Log your first meal
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Track calories, macros, recipes, and saved meals.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <WidgetStat
                        label="Today"
                        value={String(
                            records.filter((r) => r.date === todayKey()).length,
                        )}
                    />
                    <WidgetStat
                        label="Calories"
                        value={`${Math.round(records.filter((r) => r.date === todayKey()).reduce((s, r) => s + (r.calories ?? 0), 0))}`}
                    />
                    <WidgetStat
                        label="Protein"
                        value={`${Math.round(records.filter((r) => r.date === todayKey()).reduce((s, r) => s + (r.proteinGrams ?? 0), 0))}g`}
                    />
                </div>

                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'log'}
                        onClick={() => setActiveView('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'today'}
                        onClick={() => setActiveView('today')}
                    >
                        <Search className="h-3 w-3" /> Today
                    </QuickActionButton>
                    {NUTRITION_FLAGS.barcodeScan && (
                        <QuickActionButton
                            tone="green"
                            primary={activeView === 'scan'}
                            onClick={() => setActiveView('scan')}
                        >
                            <ScanBarcode className="h-3 w-3" /> Scan
                        </QuickActionButton>
                    )}
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'repeat'}
                        onClick={() => setActiveView('repeat')}
                        disabled={records.length === 0}
                    >
                        <Repeat2 className="h-3 w-3" /> Repeat
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'goal'}
                        onClick={() => setActiveView('goal')}
                    >
                        <Target className="h-3 w-3" /> Goal
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'trends'}
                        onClick={() => setActiveView('trends')}
                    >
                        <BarChart3 className="h-3 w-3" /> Trends
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'summary'}
                        onClick={() => setActiveView('summary')}
                    >
                        <Utensils className="h-3 w-3" /> Summary
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'history'}
                        onClick={() => setActiveView('history')}
                    >
                        History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="green"
                        primary={activeView === 'saved'}
                        onClick={() => setActiveView('saved')}
                    >
                        Saved
                    </QuickActionButton>
                </div>

                {/* Log entry / edit form */}
                {activeView === 'log' || editRecord ? (
                    <div className="space-y-2">
                        {editRecord && (
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                Editing entry
                            </p>
                        )}
                        <QuickEntryForm
                            initialCategory="meal"
                            lockCategory
                            {...(editPayload !== undefined && {
                                editEntry: editPayload,
                            })}
                            onSubmit={async (e) => {
                                if (editRecord) {
                                    await handleUpdate(editRecord.id, e);
                                    setEditRecord(null);
                                } else {
                                    await handleAdd(e);
                                }
                                setActiveView('summary');
                            }}
                            onCancel={() => {
                                setActiveView('summary');
                                setEditRecord(null);
                            }}
                        />
                    </div>
                ) : (
                    <>
                        {/* Active view content */}
                        {activeView === 'summary' && (
                            <SummaryView
                                records={records}
                                calorieTarget={calorieTarget}
                                proteinMin={proteinMin}
                                onLog={() => setActiveView('log')}
                                onGoal={() => setActiveView('goal')}
                            />
                        )}
                        {activeView === 'today' && (
                            <TodayView
                                records={records}
                                onEdit={handleEdit}
                                onDelete={handleDeleteMeal}
                            />
                        )}
                        {activeView === 'history' && (
                            <HistoryView
                                records={records}
                                onEdit={handleEdit}
                                onDelete={handleDeleteMeal}
                            />
                        )}
                        {activeView === 'trends' && (
                            <TrendsView
                                records={records}
                                calorieTarget={calorieTarget}
                                proteinMin={proteinMin}
                            />
                        )}
                        {activeView === 'goal' && (
                            <MealGoalPanel
                                onClose={() => setActiveView('summary')}
                            />
                        )}
                        {activeView === 'scan' && (
                            <div className="space-y-2">
                                <QuickActionButton
                                    tone="green"
                                    onClick={() => setShowBarcode(true)}
                                >
                                    <ScanBarcode className="h-3 w-3" /> Open
                                    scanner
                                </QuickActionButton>
                                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                                    Scan a barcode to log a packaged food.
                                </p>
                            </div>
                        )}
                        {activeView === 'repeat' && (
                            <div className="space-y-2">
                                <QuickActionButton
                                    tone="green"
                                    onClick={() => void handleRepeatLast()}
                                    disabled={records.length === 0}
                                >
                                    <Repeat2 className="h-3 w-3" /> Repeat last
                                    meal
                                </QuickActionButton>
                                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                                    {records.length === 0
                                        ? 'No previous meals to repeat yet.'
                                        : 'Repeats the most recent meal for today.'}
                                </p>
                            </div>
                        )}
                        {activeView === 'saved' && (
                            <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                                Saved meals are available from the full
                                nutrition dashboard.
                            </p>
                        )}
                    </>
                )}
                <BarcodeModal
                    open={showBarcode}
                    onClose={() => setShowBarcode(false)}
                    onResult={(result) => {
                        void handleAdd({
                            category: 'meal',
                            entryDate: todayKey(),
                            metadata: foodResultToMealMetadata(result, {
                                quantity: 1,
                                mealType: 'snack',
                            }),
                            tags: ['barcode'],
                            source: 'manual',
                        });
                        setShowBarcode(false);
                    }}
                />
            </div>
        </WidgetShell>
    );
}
