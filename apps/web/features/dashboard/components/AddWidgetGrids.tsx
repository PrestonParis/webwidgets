'use client';

import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
    getDashboardWidgetLibrary,
    type DashboardWidgetLibraryEntry,
} from '@/features/platform/lib/dashboardWidgetLibrary';
import type { Tracker } from '@/features/recovery/types/recovery';
import { RecoveryTrackerSection } from './AddWidgetRecovery';
import {
    getWidgetCategory,
    WIDGET_CATEGORIES,
    type WidgetCategory,
} from './addWidgetConstants';

interface WidgetGridProps {
    presentTypes: Set<string>;
    presentTrackerIds: Set<string>;
    onAdd: (type: string) => void;
    onAddTracker?: (tracker: Tracker) => void;
    onAddAllTrackers?: (trackers: Tracker[]) => void;
    isAdmin: boolean;
    search: string;
    selectedCategory: WidgetCategory | null;
}

export function WidgetGrid({
    presentTypes,
    presentTrackerIds,
    onAdd,
    onAddTracker,
    onAddAllTrackers,
    isAdmin,
    search,
    selectedCategory,
}: WidgetGridProps) {
    const q = search.toLowerCase();
    const visible = getDashboardWidgetLibrary()
        .filter((w) => !w.adminOnly || isAdmin)
        .filter((w) => w.type !== 'recovery')
        .filter(
            (w) => !selectedCategory || selectedCategory.types.includes(w.type),
        )
        .filter(
            (w) =>
                !q ||
                w.name.toLowerCase().includes(q) ||
                w.description.toLowerCase().includes(q) ||
                w.type.toLowerCase().includes(q),
        );

    return (
        <div className="p-3 max-h-80 overflow-y-auto no-scrollbar">
            {visible.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 py-4">
                    No widgets match &ldquo;{search}&rdquo;
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {visible.map((entry) => {
                        if (
                            entry.type === 'recovery-empty' &&
                            onAddTracker &&
                            onAddAllTrackers
                        ) {
                            return (
                                <div key={entry.type} className="col-span-2">
                                    <RecoveryTrackerSection
                                        presentTrackerIds={presentTrackerIds}
                                        onAddTracker={onAddTracker}
                                        onAddAllTrackers={onAddAllTrackers}
                                    />
                                </div>
                            );
                        }
                        const present = presentTypes.has(entry.type);
                        const category = getWidgetCategory(entry.type);
                        return (
                            <button
                                key={entry.type}
                                onClick={() => !present && onAdd(entry.type)}
                                disabled={present}
                                className={cn(
                                    'flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all',
                                    present
                                        ? 'opacity-40 cursor-default bg-zinc-50 dark:bg-zinc-800/50'
                                        : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:ring-1 hover:ring-blue-200 dark:hover:ring-blue-800',
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-base">
                                        {entry.emoji}
                                    </span>
                                    {present ? (
                                        <Check
                                            size={11}
                                            className="text-zinc-400"
                                        />
                                    ) : (
                                        <Plus
                                            size={11}
                                            className="text-zinc-400"
                                        />
                                    )}
                                </div>
                                {category && (
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                                            category.color.chip,
                                        )}
                                    >
                                        {category.label}
                                    </span>
                                )}
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">
                                    {entry.name}
                                </p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight line-clamp-2">
                                    {entry.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface CategoryGridProps {
    entries: DashboardWidgetLibraryEntry[];
    isAdmin: boolean;
    onSelect: (category: WidgetCategory) => void;
}

export function CategoryGrid({
    entries,
    isAdmin,
    onSelect,
}: CategoryGridProps) {
    const available = entries.filter((w) => !w.adminOnly || isAdmin);
    return (
        <div className="p-3 max-h-80 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 gap-2">
                {WIDGET_CATEGORIES.map((category) => {
                    const count = available.filter((entry) =>
                        category.types.includes(entry.type),
                    ).length;
                    if (count === 0) return null;
                    const Icon = category.icon;
                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onSelect(category)}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all hover:ring-1',
                                category.color.bar,
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                    category.color.icon,
                                )}
                            >
                                <Icon size={16} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-white">
                                    {category.label}
                                </span>
                                <span className="block truncate text-[10px] text-white/55">
                                    {category.description}
                                </span>
                            </span>
                            <span className="text-[10px] font-semibold text-white/55">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
