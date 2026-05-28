'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FolderPlus, Search, X } from 'lucide-react';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import type { Tracker } from '@/features/recovery/types/recovery';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { type WidgetCategory } from './addWidgetConstants';
import { UnpresentedSection } from './AddWidgetUnpresented';
import { WidgetGrid, CategoryGrid } from './AddWidgetGrids';

interface AddWidgetPanelProps {
    layout: WidgetConfig[];
    onAdd: (type: string) => void;
    onRestore?: (id: string) => void;
    onAddFolder?: () => void;
    onAddTracker?: (tracker: Tracker) => void;
    onAddAllTrackers?: (trackers: Tracker[]) => void;
    onClose: () => void;
}

export function AddWidgetPanel({
    layout,
    onAdd,
    onRestore,
    onAddFolder,
    onAddTracker,
    onAddAllTrackers,
    onClose,
}: AddWidgetPanelProps) {
    const { isAdmin } = useIsAdmin();
    const ref = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] =
        useState<WidgetCategory | null>(null);
    const library = getDashboardWidgetLibrary();

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                onClose();
        }
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClickOutside);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, [onClose]);

    const presentTypes = new Set<string>(
        layout
            .filter((w) => !w.unpresented && w.containerId !== 'bucket')
            .map((w) => w.type),
    );
    const presentTrackerIds = new Set<string>(
        layout
            .filter((w) => w.type === 'recovery')
            .map((w) => w.id.replace('widget-recovery-', '')),
    );
    const unpresented = layout.filter((w) => w.unpresented);

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Add Widget
                </p>
                <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                    <Search size={13} className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            if (e.target.value) setSelectedCategory(null);
                        }}
                        placeholder="Search widgets…"
                        className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>
            </div>

            {!search && onAddFolder && (
                <div className="px-3 pt-2 pb-1">
                    <button
                        onClick={onAddFolder}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors text-sm font-semibold"
                    >
                        <FolderPlus size={15} /> New Folder
                    </button>
                </div>
            )}
            {!search && onAddFolder && (
                <div className="mx-3 my-2 border-t border-gray-100 dark:border-zinc-800" />
            )}
            {!search && onRestore && unpresented.length > 0 && (
                <UnpresentedSection
                    unpresented={unpresented}
                    onRestore={(id) => onRestore?.(id)}
                />
            )}
            {!search && selectedCategory && (
                <div className="px-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        <ArrowLeft size={12} /> {selectedCategory.label}
                    </button>
                </div>
            )}
            {!search && !selectedCategory ? (
                <CategoryGrid
                    entries={library}
                    isAdmin={isAdmin}
                    onSelect={setSelectedCategory}
                />
            ) : (
                <WidgetGrid
                    presentTypes={presentTypes}
                    presentTrackerIds={presentTrackerIds}
                    onAdd={(type) => onAdd(type)}
                    onAddTracker={onAddTracker}
                    onAddAllTrackers={onAddAllTrackers}
                    isAdmin={isAdmin}
                    search={search}
                    selectedCategory={selectedCategory}
                />
            )}
        </div>
    );
}
