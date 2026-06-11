'use client';

import { useState, useMemo } from 'react';
import { NutritionGoalPanel } from './NutritionGoalPanel';
import { NutritionTodayPanel } from './NutritionTodayPanel';
import { NutritionAnalyticsPanel } from './NutritionAnalyticsPanel';
import { RecipesPanel } from './RecipesPanel';
import { SavedMealsPanel } from './SavedMealsPanel';
import { NutritionImportPanel } from './NutritionImportPanel';
import {
    SurfaceTabs,
    TrackingHero,
    TrackingKpi,
    TrackingSection,
} from '@/features/tracking/components/TrackingSurface';
import { normalizeMealEntries } from '@/features/tracking/lib/meal/normalize';
import {
    extractMealGoalConfig,
    formatMealTime,
    calorieStatus,
    calorieStatusLabel,
    MEAL_TYPE_LABELS,
    MEAL_TYPE_ICONS,
} from '@/features/tracking/lib/meal/helpers';
import type { MealRecord } from '@/features/tracking/types/meal';
import {
    extractNutritionGoalConfig,
    computeGoalProgress,
    goalProgressLabel,
} from '@/features/tracking/lib/meal/nutrition/goals';
import { dayTotals } from '@/features/tracking/lib/meal/nutrition/analytics';
import {
    buildMealHistoryCsv,
    buildDailySummaryCsv,
    downloadCsv,
} from '@/features/tracking/lib/meal/nutrition/export';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import type {
    TrackingEntry,
    BaseTrackingEntry,
} from '@/features/tracking/types/trackingEntries';

type MealTab =
    | 'today'
    | 'history'
    | 'recipes'
    | 'saved'
    | 'analytics'
    | 'goals'
    | 'data';

const HISTORY_PAGE_SIZE = 25;

function buildTabs(): { id: MealTab; label: string }[] {
    const tabs: { id: MealTab; label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: 'history', label: 'History' },
    ];
    if (NUTRITION_FLAGS.recipes) tabs.push({ id: 'recipes', label: 'Recipes' });
    if (NUTRITION_FLAGS.savedMeals)
        tabs.push({ id: 'saved', label: 'Saved Meals' });
    tabs.push({ id: 'analytics', label: 'Analytics' });
    tabs.push({ id: 'goals', label: 'Goals' });
    if (NUTRITION_FLAGS.imports || NUTRITION_FLAGS.exports)
        tabs.push({ id: 'data', label: 'Import / Export' });
    return tabs;
}

// ─── history (paginated) ────────────────────────────────────────────────────

function MealHistoryTab({
    records,
    onEdit,
    onDelete,
}: {
    records: MealRecord[];
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return records;
        return records.filter(
            (r) =>
                (r.title ?? '').toLowerCase().includes(q) ||
                (r.mealType ?? '').toLowerCase().includes(q) ||
                (r.notes ?? '').toLowerCase().includes(q),
        );
    }, [records, search]);

    const pageCount = Math.max(
        1,
        Math.ceil(filtered.length / HISTORY_PAGE_SIZE),
    );
    const safePage = Math.min(page, pageCount - 1);
    const pageItems = filtered.slice(
        safePage * HISTORY_PAGE_SIZE,
        (safePage + 1) * HISTORY_PAGE_SIZE,
    );

    if (records.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-10">
                No meal entries yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor="meal-history-search" className="sr-only">
                    Search meal history
                </label>
                <input
                    id="meal-history-search"
                    type="search"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    placeholder="Search meals…"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-green-400"
                />
            </div>

            {pageItems.length === 0 ? (
                <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-6">
                    No meals match your search.
                </p>
            ) : (
                <div className="space-y-1">
                    {pageItems.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                            <span className="text-base shrink-0">
                                {r.mealType
                                    ? MEAL_TYPE_ICONS[r.mealType]
                                    : '🍽️'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                        {r.title ??
                                            (r.mealType
                                                ? MEAL_TYPE_LABELS[r.mealType]
                                                : 'Meal')}
                                    </span>
                                    {r.calories !== null && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            {Math.round(r.calories)} kcal
                                        </span>
                                    )}
                                    {r.proteinGrams !== null && (
                                        <span className="text-xs text-blue-500 dark:text-blue-400">
                                            {Math.round(r.proteinGrams)}g
                                            protein
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                    {formatDate(r.date)}
                                    {formatMealTime(r) &&
                                        ` · ${formatMealTime(r)}`}
                                    {r.notes && ` · ${r.notes}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => onEdit(r.raw)}
                                    className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                                    aria-label={`Edit ${r.title ?? 'meal entry'} on ${r.date}`}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(r.id)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                    aria-label={`Delete ${r.title ?? 'meal entry'} on ${r.date}`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pageCount > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={safePage === 0}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                        Page {safePage + 1} of {pageCount}
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            setPage((p) => Math.min(pageCount - 1, p + 1))
                        }
                        disabled={safePage >= pageCount - 1}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── data (import / export) ─────────────────────────────────────────────────

function DataTab({
    records,
    onAdd,
}: {
    records: MealRecord[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
}) {
    const handleImport = async (entries: BaseTrackingEntry[]) => {
        for (const entry of entries) {
            await onAdd(entry);
        }
    };

    return (
        <div className="space-y-6">
            {NUTRITION_FLAGS.imports && (
                <NutritionImportPanel
                    existingRecords={records}
                    onImport={handleImport}
                />
            )}
            {NUTRITION_FLAGS.exports && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Export
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        Download your meal data as CSV.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            disabled={records.length === 0}
                            onClick={() =>
                                downloadCsv(
                                    'meal-history.csv',
                                    buildMealHistoryCsv(records),
                                )
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-colors"
                        >
                            Export meal history
                        </button>
                        <button
                            type="button"
                            disabled={records.length === 0}
                            onClick={() =>
                                downloadCsv(
                                    'daily-summaries.csv',
                                    buildDailySummaryCsv(records),
                                )
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 disabled:opacity-40 transition-colors"
                        >
                            Export daily summaries
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── main ───────────────────────────────────────────────────────────────────

interface MealCategoryViewProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

export function MealCategoryView({
    entries,
    onAdd,
    onEdit,
    onDelete,
}: MealCategoryViewProps) {
    const [activeTab, setActiveTab] = useState<MealTab>('today');
    const { allGoals } = useTrackingGoals('meal');
    const tabs = useMemo(() => buildTabs(), []);

    const records = useMemo(() => normalizeMealEntries(entries), [entries]);
    const legacyGoals = useMemo(
        () => extractMealGoalConfig(allGoals),
        [allGoals],
    );
    const goalConfig = useMemo(
        () => extractNutritionGoalConfig(allGoals),
        [allGoals],
    );
    const { calorieTarget, proteinMin } = legacyGoals;

    const today = new Date().toISOString().slice(0, 10);
    const todayTotals = useMemo(
        () => dayTotals(records, today),
        [records, today],
    );
    const progress = useMemo(
        () => computeGoalProgress(goalConfig, todayTotals),
        [goalConfig, todayTotals],
    );

    const status = calorieStatus(todayTotals.calories, calorieTarget);
    return (
        <div className="space-y-4">
            <TrackingHero
                eyebrow="Nutrition dashboard"
                title={records[0]?.title ?? 'Ready for your first meal'}
                subtitle={
                    records[0]
                        ? `${formatDate(records[0].date)} · ${calorieStatusLabel(status)}`
                        : 'Log meals, search foods, build recipes, and track nutrition goals.'
                }
                tone="green"
                kpis={
                    <>
                        <TrackingKpi
                            label="Today's meals"
                            value={
                                todayTotals.mealCount > 0
                                    ? String(todayTotals.mealCount)
                                    : 'N/A'
                            }
                            sub={
                                todayTotals.mealCount === 0
                                    ? 'None logged today'
                                    : undefined
                            }
                        />
                        <TrackingKpi
                            label="Today's calories"
                            value={
                                todayTotals.calories > 0
                                    ? `${Math.round(todayTotals.calories)} kcal`
                                    : 'N/A'
                            }
                            sub={
                                calorieTarget
                                    ? `of ${calorieTarget.toLocaleString()} target`
                                    : undefined
                            }
                        />
                        <TrackingKpi
                            label="Today's protein"
                            value={
                                todayTotals.proteinGrams > 0
                                    ? `${Math.round(todayTotals.proteinGrams)}g`
                                    : 'N/A'
                            }
                            sub={
                                proteinMin
                                    ? `of ${proteinMin}g target`
                                    : undefined
                            }
                        />
                        <TrackingKpi
                            label="Today's carbs / fat"
                            value={
                                todayTotals.carbsGrams > 0 ||
                                todayTotals.fatGrams > 0
                                    ? `${Math.round(todayTotals.carbsGrams)}g / ${Math.round(todayTotals.fatGrams)}g`
                                    : 'N/A'
                            }
                        />
                        <TrackingKpi
                            label="Status"
                            value={
                                todayTotals.mealCount > 0
                                    ? calorieStatusLabel(status)
                                    : 'No meals'
                            }
                        />
                    </>
                }
            />

            {/* Goal progress */}
            {progress.length > 0 && todayTotals.mealCount > 0 && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                    {progress.map((item) => (
                        <div key={item.key}>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-600 dark:text-zinc-400">
                                    {item.label}
                                </span>
                                <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                                    {goalProgressLabel(item)}
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={item.pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${item.label}: ${goalProgressLabel(item)}`}
                            >
                                <div
                                    className={`h-full rounded-full transition-all ${item.met ? 'bg-green-500' : 'bg-amber-400'}`}
                                    style={{ width: `${item.pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SurfaceTabs
                items={tabs}
                active={activeTab}
                onChange={setActiveTab}
                tone="green"
            />

            {/* Tab content */}
            {activeTab === 'today' && (
                <NutritionTodayPanel
                    records={records}
                    onAdd={onAdd}
                    onEdit={(r) => onEdit(r.raw)}
                    onDelete={onDelete}
                />
            )}
            {activeTab === 'history' && (
                <TrackingSection>
                    <MealHistoryTab
                        records={records}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </TrackingSection>
            )}
            {activeTab === 'recipes' && <RecipesPanel onLog={onAdd} />}
            {activeTab === 'saved' && <SavedMealsPanel onLog={onAdd} />}
            {activeTab === 'analytics' && (
                <NutritionAnalyticsPanel records={records} goals={goalConfig} />
            )}
            {activeTab === 'goals' && <NutritionGoalPanel />}
            {activeTab === 'data' && (
                <DataTab records={records} onAdd={onAdd} />
            )}
        </div>
    );
}
