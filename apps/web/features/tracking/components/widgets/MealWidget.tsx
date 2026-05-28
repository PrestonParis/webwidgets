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
import { normalizeMealEntries } from '@/features/tracking/lib/meal/normalize';
import {
    extractMealGoalConfig,
    mealRecordSummary,
} from '@/features/tracking/lib/meal/helpers';
import type {
    MealViewMode,
    MealRecord,
} from '@/features/tracking/lib/meal/types';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { BarcodeModal } from '@/features/tracking/components/meal/BarcodeModal';
import { foodResultToMealMetadata } from '@/features/tracking/lib/meal/nutrition/foodItem';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import { MealSummaryView } from '@/features/tracking/components/meal/MealSummaryView';
import { MealTodayView } from '@/features/tracking/components/meal/MealTodayView';
import { MealHistoryView } from '@/features/tracking/components/meal/MealHistoryView';
import { MealTrendsView } from '@/features/tracking/components/meal/MealTrendsView';

type MealWidgetView =
    | MealViewMode
    | 'log'
    | 'scan'
    | 'repeat'
    | 'goal'
    | 'saved';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

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
                        {activeView === 'summary' && (
                            <MealSummaryView
                                records={records}
                                calorieTarget={calorieTarget}
                                proteinMin={proteinMin}
                                onLog={() => setActiveView('log')}
                                onGoal={() => setActiveView('goal')}
                            />
                        )}
                        {activeView === 'today' && (
                            <MealTodayView
                                records={records}
                                onEdit={handleEdit}
                                onDelete={handleDeleteMeal}
                            />
                        )}
                        {activeView === 'history' && (
                            <MealHistoryView
                                records={records}
                                onEdit={handleEdit}
                                onDelete={handleDeleteMeal}
                            />
                        )}
                        {activeView === 'trends' && (
                            <MealTrendsView
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
