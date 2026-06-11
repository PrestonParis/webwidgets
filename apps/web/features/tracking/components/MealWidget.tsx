'use client';

import { useState, useMemo } from 'react';
import { Repeat2, ScanBarcode, Utensils } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { WidgetStat } from '@/features/tracking/components/TrackingSurface';
import { normalizeMealEntries } from '@/features/tracking/lib/meal/normalize';
import {
    extractMealGoalConfig,
    mealRecordSummary,
} from '@/features/tracking/lib/meal/helpers';
import type { MealRecord } from '@/features/tracking/types/meal';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { BarcodeModal } from '@/features/tracking/components/BarcodeModal';
import { foodResultToMealMetadata } from '@/features/tracking/lib/meal/nutrition/foodItem';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import { MealTrendsView } from '@/features/tracking/components/MealTrendsView';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'saved';

function getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function MealWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const [editRecord, setEditRecord] = useState<MealRecord | null>(null);
    const [showBarcode, setShowBarcode] = useState(false);

    const { entries, refetch } = useTrackingEntries({
        category: 'meal',
        limit: 100,
    });
    const { handleAdd, handleUpdate } = useTrackingActions(refetch);
    const { allGoals } = useTrackingGoals('meal');

    const records = useMemo(() => normalizeMealEntries(entries), [entries]);
    const goalConfig = useMemo(
        () => extractMealGoalConfig(allGoals),
        [allGoals],
    );
    const { calorieTarget, proteinMin } = goalConfig;
    const todayKey = getTodayKey();
    const todayRecords = records.filter((r) => r.date === todayKey);

    const editPayload = editRecord
        ? {
              id: editRecord.id,
              metadata: editRecord.raw.metadata,
              entryDate: editRecord.date,
              ...(editRecord.notes !== null && { notes: editRecord.notes }),
          }
        : undefined;

    const topMeals = useMemo(() => {
        const counts: Record<string, { count: number; record: MealRecord }> =
            {};
        for (const r of records) {
            const key = r.title ?? 'Meal';
            counts[key] = { count: (counts[key]?.count ?? 0) + 1, record: r };
        }
        return Object.entries(counts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 6)
            .map(([name, { count, record }]) => ({ name, count, record }));
    }, [records]);

    return (
        <WidgetShell
            icon={<Utensils className="h-4 w-4 text-green-600" />}
            title="Meals"
            footerHref="/tracking"
            footerLabel="Open nutrition dashboard"
            widgetId="meal-widget"
            widgetType="tracking-meal"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Meals"
                />
            }
        >
            <div className="space-y-3">
                {/* Tab bar */}
                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'saved'] as const).map(
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
                                {t === 'saved'
                                    ? 'Saved'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
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
                                setTab('history');
                            }}
                            onCancel={() => {
                                setTab('history');
                                setEditRecord(null);
                            }}
                        />
                        {NUTRITION_FLAGS.barcodeScan && (
                            <button
                                type="button"
                                onClick={() => setShowBarcode(true)}
                                className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400"
                            >
                                <ScanBarcode className="h-3 w-3" /> Scan barcode
                            </button>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={records.map((r) => r.date)}
                            accentColor="green"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {records.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No meal entries yet.
                                </p>
                            ) : (
                                records.slice(0, 20).map((record) => (
                                    <div
                                        key={record.id}
                                        className={`rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 ${record.date === todayKey ? 'ring-1 ring-green-400' : ''}`}
                                    >
                                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-100">
                                            {record.title ?? 'Meal'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                            {formatDate(record.date)} ·{' '}
                                            {mealRecordSummary(record)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <WidgetStat
                                label="Today meals"
                                value={String(todayRecords.length)}
                            />
                            <WidgetStat
                                label="Calories"
                                value={`${Math.round(todayRecords.reduce((s, r) => s + (r.calories ?? 0), 0))}`}
                            />
                            <WidgetStat
                                label="Protein"
                                value={`${Math.round(todayRecords.reduce((s, r) => s + (r.proteinGrams ?? 0), 0))}g`}
                            />
                        </div>
                        <MealTrendsView
                            records={records}
                            calorieTarget={calorieTarget}
                            proteinMin={proteinMin}
                        />
                    </div>
                )}

                {tab === 'saved' && (
                    <div className="space-y-2">
                        {topMeals.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                No meals logged yet.
                            </p>
                        ) : (
                            topMeals.map(({ name, count, record }) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-zinc-800/70 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium text-gray-800 dark:text-zinc-100">
                                            {name}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                            {count}x logged
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleAdd({
                                                category: 'meal',
                                                entryDate: todayKey,
                                                metadata: {
                                                    ...record.raw.metadata,
                                                },
                                                tags: record.raw.tags ?? [],
                                                source: 'manual',
                                                ...(record.raw.notes !==
                                                    undefined && {
                                                    notes: record.raw.notes,
                                                }),
                                            });
                                            setTab('history');
                                        }}
                                        className="shrink-0 ml-2 rounded-md bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-300"
                                    >
                                        Log again
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <BarcodeModal
                    open={showBarcode}
                    onClose={() => setShowBarcode(false)}
                    onResult={(result) => {
                        void handleAdd({
                            category: 'meal',
                            entryDate: todayKey,
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
