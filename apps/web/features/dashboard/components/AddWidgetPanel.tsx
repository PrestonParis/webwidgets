'use client';

import { useEffect, useRef, useState } from 'react';
import {
    ArrowLeft,
    BookOpenText,
    Check,
    Clock3,
    FolderPlus,
    HeartPulse,
    Landmark,
    Layers3,
    Mail,
    Plus,
    Search,
    Sparkles,
    Wrench,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
    getDashboardWidgetLibrary,
    type DashboardWidgetLibraryEntry,
} from '@/features/platform/lib/dashboardWidgetLibrary';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import type { Tracker } from '@/features/recovery/types/recovery';
import type {
    WidgetConfig,
    WidgetType,
} from '@/features/dashboard/types/dashboard';

interface AddWidgetPanelProps {
    layout: WidgetConfig[];
    onAdd: (type: string) => void;
    onRestore?: (id: string) => void;
    onAddFolder?: () => void;
    onAddTracker?: (tracker: Tracker) => void;
    onClose: () => void;
}

// ─── sub-sections ─────────────────────────────────────────────────────────────

interface WidgetCategory {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    types: WidgetType[];
}

const WIDGET_CATEGORIES: WidgetCategory[] = [
    {
        id: 'time',
        label: 'Time',
        description: 'Timers, countdowns, clocks, and focus sessions',
        icon: Clock3,
        types: [
            'timekeeping',
            'timer',
            'stopwatch',
            'countdown',
            'pomodoro',
            'worldclock',
        ],
    },
    {
        id: 'text',
        label: 'Text Editor',
        description: 'Writing, journals, notes, and scratchpads',
        icon: BookOpenText,
        types: ['texteditor', 'journal', 'notes', 'scratchpad'],
    },
    {
        id: 'planning',
        label: 'Utilities',
        description:
            'Tasks, calendar, email, converter, files, viewer, weather, and personal routines',
        icon: Layers3,
        types: [
            'todo',
            'calendar',
            'email',
            'converter',
            'calculator',
            'files',
            'view',
            'weather',
        ],
    },
    {
        id: 'health',
        label: 'Logging and Tracking',
        description:
            'Habits, mood, recovery, workouts, sleep, meals, and supplements',
        icon: HeartPulse,
        types: [
            'habit',
            'recovery-empty',
            'tracking',
            'tracking-mood',
            'tracking-sleep',
            'tracking-workout',
            'tracking-meal',
            'tracking-supplements',
            'tracking-health',
        ],
    },
    {
        id: 'finance-data',
        label: 'Finance',
        description: 'Markets and money',
        icon: Landmark,
        types: ['finance', 'currency'],
    },
    {
        id: 'communication',
        label: 'Communication',
        description: 'Chat',
        icon: Mail,
        types: [],
    },
    {
        id: 'webwidgets',
        label: 'WebWidgets',
        description:
            'AI Chat, collaboration, insights, context, and builder tools',
        icon: Sparkles,
        types: [
            'chat',
            'collaboration',
            'insight-cards',
            'context-diagram',
            'widget-builder',
        ],
    },
    {
        id: 'creative-intel',
        label: 'Creative & Intel',
        description: 'Research',
        icon: Sparkles,
        types: [],
    },
    {
        id: 'tools',
        label: 'Tools',
        description:
            'Automation, accessibility, developer, research, and system tools',
        icon: Wrench,
        types: [
            'automation',
            'accessibility',
            'developer',
            'form-filler',
            'research-queue',
        ],
    },
    {
        id: 'entertainment',
        label: 'Entertainment',
        description: 'News, reading, creative studio, games, and learning',
        icon: Sparkles,
        types: ['chess', 'memorization', 'news', 'reading', 'creative'],
    },
];

interface UnpresentedSectionProps {
    unpresented: WidgetConfig[];
    onRestore: (id: string) => void;
}

function UnpresentedSection({
    unpresented,
    onRestore,
}: UnpresentedSectionProps) {
    return (
        <div className="border-b border-gray-100 dark:border-zinc-800">
            <div className="px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                    Restore unpresented
                </p>
                <div className="space-y-1">
                    {unpresented.map((w) => {
                        const entry = getDashboardWidgetLibrary().find(
                            (c) => c.type === w.type,
                        );
                        return (
                            <button
                                key={w.id}
                                onClick={() => onRestore(w.id)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all text-left"
                            >
                                <span>{entry?.emoji ?? '📦'}</span>
                                <span>{entry?.name ?? w.type}</span>
                                <Plus
                                    size={10}
                                    className="ml-auto text-zinc-400"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface RecoveryTrackerSectionProps {
    presentTrackerIds: Set<string>;
    onAddTracker: (tracker: Tracker) => void;
}

function RecoveryTrackerSection({
    presentTrackerIds,
    onAddTracker,
}: RecoveryTrackerSectionProps) {
    const { trackers } = useTrackers();
    if (!trackers || trackers.length === 0) return null;
    const allAdded = trackers.every((t) => presentTrackerIds.has(t.id));
    return (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-base">💜</span>
                    <div>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Recovery Trackers
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            Add individual trackers to dashboard
                        </p>
                    </div>
                </div>
                {!allAdded && (
                    <button
                        onClick={() =>
                            trackers
                                .filter((t) => !presentTrackerIds.has(t.id))
                                .forEach((t) => onAddTracker(t))
                        }
                        className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        Add all
                    </button>
                )}
            </div>
            <div className="space-y-1 border-t border-zinc-200 dark:border-zinc-700 pt-2">
                {trackers.map((t) => {
                    const added = presentTrackerIds.has(t.id);
                    return (
                        <button
                            key={t.id}
                            onClick={() => !added && onAddTracker(t)}
                            disabled={added}
                            className={cn(
                                'flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-xs font-semibold transition-all text-left',
                                added
                                    ? 'opacity-40 cursor-default text-zinc-500 dark:text-zinc-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
                            )}
                        >
                            <span className="text-sm">💜</span>
                            <span className="flex-1">
                                {t.addiction || 'Recovery Tracker'}
                            </span>
                            {added ? (
                                <Check size={11} className="text-zinc-400" />
                            ) : (
                                <Plus size={11} className="text-zinc-400" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface WidgetGridProps {
    presentTypes: Set<string>;
    presentTrackerIds: Set<string>;
    onAdd: (type: string) => void;
    onAddTracker?: (tracker: Tracker) => void;
    isAdmin: boolean;
    search: string;
    selectedCategory: WidgetCategory | null;
}

function WidgetGrid({
    presentTypes,
    presentTrackerIds,
    onAdd,
    onAddTracker,
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
                        if (entry.type === 'recovery-empty' && onAddTracker) {
                            return (
                                <div key={entry.type} className="col-span-2">
                                    <RecoveryTrackerSection
                                        presentTrackerIds={presentTrackerIds}
                                        onAddTracker={onAddTracker}
                                    />
                                </div>
                            );
                        }
                        const present = presentTypes.has(entry.type);
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

function CategoryGrid({
    entries,
    isAdmin,
    onSelect,
}: {
    entries: DashboardWidgetLibraryEntry[];
    isAdmin: boolean;
    onSelect: (category: WidgetCategory) => void;
}) {
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
                            className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-left transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:ring-1 hover:ring-blue-200 dark:hover:ring-blue-800"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-300">
                                <Icon size={16} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                                    {category.label}
                                </span>
                                <span className="block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {category.description}
                                </span>
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AddWidgetPanel({
    layout,
    onAdd,
    onRestore,
    onAddFolder,
    onAddTracker,
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Search bar */}
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
                        onClick={() => {
                            onAddFolder();
                        }}
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
                    onRestore={(id) => {
                        onRestore?.(id);
                    }}
                />
            )}
            {!search && selectedCategory && (
                <div className="px-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        <ArrowLeft size={12} />
                        {selectedCategory.label}
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
                    onAdd={(type) => {
                        onAdd(type);
                    }}
                    onAddTracker={onAddTracker}
                    isAdmin={isAdmin}
                    search={search}
                    selectedCategory={selectedCategory}
                />
            )}
        </div>
    );
}
