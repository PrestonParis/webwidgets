'use client';

import { useState } from 'react';
import {
    ADDICTION_CATEGORIES,
    CATEGORY_COLORS,
} from '@/features/recovery/constants';
import { AddTrackerDrawerProps } from '@/types/recovery';

export default function AddTrackerDrawer({
    isOpen,
    onClose,
    onAdd,
    existingTrackers,
}: AddTrackerDrawerProps) {
    const [selectedAddiction, setSelectedAddiction] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!selectedAddiction) return;
        setIsAdding(true);
        await onAdd(selectedAddiction);
        setIsAdding(false);
        setSelectedAddiction('');
        setActiveCategory(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20"
                onClick={() => {
                    onClose();
                    setSelectedAddiction('');
                    setActiveCategory(null);
                }}
            />

            {/* Drawer */}
            <div className="relative z-50 w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-xl flex flex-col">
                {/* Drawer header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-zinc-100">
                            Add a tracker
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            Pick a category then choose what to track
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            setSelectedAddiction('');
                            setActiveCategory(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Categories */}
                    <div>
                        <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mb-3">
                            CATEGORIES
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(ADDICTION_CATEGORIES).map((cat) => {
                                const c = CATEGORY_COLORS[cat];
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setActiveCategory(
                                                isActive ? null : cat,
                                            );
                                            setSelectedAddiction('');
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            isActive
                                                ? `${c.activeBg} ${c.activeText}`
                                                : `${c.bg} ${c.text}`
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Addiction list for active category */}
                    {activeCategory && (
                        <div>
                            <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mb-3">
                                {activeCategory.toUpperCase()}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {ADDICTION_CATEGORIES[activeCategory]
                                    .filter(
                                        (a) =>
                                            !existingTrackers.find(
                                                (t) => t.addiction === a,
                                            ),
                                    )
                                    .map((a) => (
                                        <button
                                            key={a}
                                            onClick={() =>
                                                setSelectedAddiction(a)
                                            }
                                            className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                                                selectedAddiction === a
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                    : 'border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:border-purple-200 dark:hover:border-purple-800 bg-gray-50 dark:bg-zinc-800'
                                            }`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                            </div>
                            {ADDICTION_CATEGORIES[activeCategory].filter(
                                (a) =>
                                    !existingTrackers.find(
                                        (t) => t.addiction === a,
                                    ),
                            ).length === 0 && (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                                    All items in this category are already
                                    tracked.
                                </p>
                            )}
                        </div>
                    )}

                    {!activeCategory && (
                        <div className="text-center py-8 text-gray-300 dark:text-zinc-600 text-sm">
                            Select a category above to see options
                        </div>
                    )}
                </div>

                {/* Drawer footer */}
                <div className="px-6 py-5 border-t border-gray-100 dark:border-zinc-800">
                    {selectedAddiction && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 text-center">
                            Selected:{' '}
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                                {selectedAddiction}
                            </span>
                        </p>
                    )}
                    <button
                        onClick={handleAdd}
                        disabled={!selectedAddiction || isAdding}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                    >
                        {isAdding
                            ? 'Adding...'
                            : selectedAddiction
                              ? `Start tracking ${selectedAddiction}`
                              : 'Choose something to track'}
                    </button>
                </div>
            </div>
        </div>
    );
}
