'use client';

import { useState } from 'react';
import {
    ADDICTION_CATEGORIES,
    CATEGORY_COLORS,
} from '@/features/recovery/constants';
import { AddictionPickerProps } from '@/features/recovery/types/datepicker';

const ALL_ADDICTIONS = Object.values(ADDICTION_CATEGORIES).flat();

function SearchResults({
    search,
    existingTrackers,
    selectedAddiction,
    onSelect,
}: Pick<
    AddictionPickerProps,
    'existingTrackers' | 'selectedAddiction' | 'onSelect'
> & { search: string }) {
    const lower = search.toLowerCase();
    const filtered = ALL_ADDICTIONS.filter(
        (a) =>
            a.toLowerCase().includes(lower) &&
            !existingTrackers.find((t) => t.addiction === a),
    );
    const isCustom =
        search.trim().length > 0 &&
        !ALL_ADDICTIONS.some((a) => a.toLowerCase() === lower);

    return (
        <div className="space-y-2">
            {filtered.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {filtered.slice(0, 12).map((a) => (
                        <button
                            key={a}
                            onClick={() => onSelect(a)}
                            className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${selectedAddiction === a ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:border-purple-200 dark:hover:border-purple-800 bg-gray-50 dark:bg-zinc-800'}`}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            )}
            {isCustom && (
                <button
                    onClick={() => onSelect(search.trim())}
                    className={`w-full p-3 rounded-xl border-2 border-dashed text-sm font-semibold text-left transition-all ${selectedAddiction === search.trim() ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-purple-400 dark:hover:border-purple-600'}`}
                >
                    + Add &ldquo;{search.trim()}&rdquo;
                </button>
            )}
            {filtered.length === 0 && !isCustom && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                    No matches for this category.
                </p>
            )}
        </div>
    );
}

export function AddictionPicker({
    existingTrackers,
    activeCategory,
    selectedAddiction,
    onCategoryChange,
    onSelect,
}: AddictionPickerProps) {
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Search or type a custom addiction…"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    if (activeCategory) onCategoryChange(null);
                }}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
            />

            {search ? (
                <SearchResults
                    search={search}
                    existingTrackers={existingTrackers}
                    selectedAddiction={selectedAddiction}
                    onSelect={onSelect}
                />
            ) : (
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mb-3">
                            CATEGORIES
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(ADDICTION_CATEGORIES).map((cat) => {
                                const c = CATEGORY_COLORS[cat];
                                if (!c) return null;
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() =>
                                            onCategoryChange(
                                                isActive ? null : cat,
                                            )
                                        }
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive ? `${c.activeBg} ${c.activeText}` : `${c.bg} ${c.text}`}`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {activeCategory &&
                        (() => {
                            const available = (
                                ADDICTION_CATEGORIES[activeCategory] ?? []
                            ).filter(
                                (a) =>
                                    !existingTrackers.find(
                                        (t) => t.addiction === a,
                                    ),
                            );
                            return (
                                <div>
                                    <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mb-3">
                                        {activeCategory.toUpperCase()}
                                    </p>
                                    {available.length === 0 ? (
                                        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                                            All items in this category are
                                            already tracked.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {available.map((a) => (
                                                <button
                                                    key={a}
                                                    onClick={() => onSelect(a)}
                                                    className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${selectedAddiction === a ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:border-purple-200 dark:hover:border-purple-800 bg-gray-50 dark:bg-zinc-800'}`}
                                                >
                                                    {a}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                    {!activeCategory && (
                        <div className="text-center py-8 text-gray-300 dark:text-zinc-600 text-sm">
                            Select a category above to see options
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
