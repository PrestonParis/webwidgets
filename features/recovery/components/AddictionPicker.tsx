import {
    ADDICTION_CATEGORIES,
    CATEGORY_COLORS,
} from '@/features/recovery/constants';
import { Tracker } from '@/features/recovery/types/recovery';

interface Props {
    existingTrackers: Tracker[];
    activeCategory: string | null;
    selectedAddiction: string;
    onCategoryChange: (cat: string | null) => void;
    onSelect: (addiction: string) => void;
}

export function AddictionPicker({
    existingTrackers,
    activeCategory,
    selectedAddiction,
    onCategoryChange,
    onSelect,
}: Props) {
    return (
        <div className="space-y-5">
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
                                onClick={() =>
                                    onCategoryChange(isActive ? null : cat)
                                }
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

            {activeCategory &&
                (() => {
                    const available = ADDICTION_CATEGORIES[
                        activeCategory
                    ].filter(
                        (a) => !existingTrackers.find((t) => t.addiction === a),
                    );
                    return (
                        <div>
                            <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mb-3">
                                {activeCategory.toUpperCase()}
                            </p>
                            {available.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                                    All items in this category are already
                                    tracked.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {available.map((a) => (
                                        <button
                                            key={a}
                                            onClick={() => onSelect(a)}
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
    );
}
