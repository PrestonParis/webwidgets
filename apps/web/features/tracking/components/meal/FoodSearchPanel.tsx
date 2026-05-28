'use client';

import { useFoodSearch } from '@/features/tracking/hooks/useFoodSearch';
import type { FoodSearchResult } from '@/features/tracking/lib/meal/nutrition/foodTypes';
import { makeManualResult } from '@/features/tracking/lib/meal/nutrition/providers/manualProvider';
import { NUTRITION_FLAGS } from '@/features/tracking/lib/meal/featureFlags';

interface FoodSearchPanelProps {
    /** Called when the user picks a food (or the manual fallback). */
    onSelect: (result: FoodSearchResult) => void;
    /** Optional: open the barcode scanner. */
    onScanBarcode?: () => void;
}

const inputCls =
    'w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-green-400';

export function FoodSearchPanel({
    onSelect,
    onScanBarcode,
}: FoodSearchPanelProps) {
    const {
        query,
        setQuery,
        results,
        loading,
        errors,
        providerLabels,
        hasProviders,
    } = useFoodSearch();

    if (!NUTRITION_FLAGS.foodSearch) return null;

    const showManual = query.trim().length >= 2 && !loading;

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="flex-1">
                    <label htmlFor="food-search" className="sr-only">
                        Search foods
                    </label>
                    <input
                        id="food-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search foods (e.g. chicken breast)…"
                        className={inputCls}
                        autoComplete="off"
                    />
                </div>
                {onScanBarcode && NUTRITION_FLAGS.barcodeScan && (
                    <button
                        type="button"
                        onClick={onScanBarcode}
                        aria-label="Scan barcode"
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-zinc-300 hover:border-green-400 hover:text-green-600 transition-colors"
                    >
                        Scan
                    </button>
                )}
            </div>

            {hasProviders && (
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    Searching: {providerLabels.join(', ')}
                </p>
            )}

            {errors.length > 0 && (
                <div
                    className="text-[11px] text-amber-600 dark:text-amber-400"
                    role="status"
                >
                    {errors.map((e) => (
                        <p key={e.provider}>
                            {e.provider}: {e.message}
                        </p>
                    ))}
                </div>
            )}

            {loading && (
                <p
                    className="text-sm text-gray-400 dark:text-zinc-500 py-2"
                    role="status"
                >
                    Searching…
                </p>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-zinc-500 py-2">
                    No matches found.
                </p>
            )}

            {results.length > 0 && (
                <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {results.map((r) => (
                        <li key={`${r.provider}-${r.externalId}`}>
                            <button
                                type="button"
                                onClick={() => onSelect(r)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                                        {r.name}
                                        {r.brand && (
                                            <span className="text-gray-400 dark:text-zinc-500 font-normal">
                                                {' '}
                                                · {r.brand}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs text-green-600 dark:text-green-400 shrink-0">
                                        {Math.round(r.calories)} kcal
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                    {Math.round(r.proteinGrams)}g P ·{' '}
                                    {Math.round(r.carbsGrams)}g C ·{' '}
                                    {Math.round(r.fatGrams)}g F · per{' '}
                                    {r.servingSize}
                                    {r.servingUnit}
                                    <span className="ml-1">({r.provider})</span>
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {showManual && (
                <button
                    type="button"
                    onClick={() => onSelect(makeManualResult(query.trim()))}
                    className="w-full text-xs py-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-green-400 hover:text-green-600 transition-colors"
                >
                    + Add &quot;{query.trim()}&quot; manually
                </button>
            )}
        </div>
    );
}
