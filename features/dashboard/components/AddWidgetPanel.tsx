'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, FolderPlus, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

interface AddWidgetPanelProps {
    layout: WidgetConfig[];
    onAdd: (type: string) => void;
    onRestore?: (id: string) => void;
    onAddFolder?: () => void;
    onClose: () => void;
}

// ─── sub-sections ─────────────────────────────────────────────────────────────

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

interface WidgetGridProps {
    presentTypes: Set<string>;
    onAdd: (type: string) => void;
    isAdmin: boolean;
    search: string;
}

function WidgetGrid({ presentTypes, onAdd, isAdmin, search }: WidgetGridProps) {
    const q = search.toLowerCase();
    const visible = getDashboardWidgetLibrary()
        .filter((w) => !w.adminOnly || isAdmin)
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

// ─── main component ───────────────────────────────────────────────────────────

export function AddWidgetPanel({
    layout,
    onAdd,
    onRestore,
    onAddFolder,
    onClose,
}: AddWidgetPanelProps) {
    const { isAdmin } = useIsAdmin();
    const ref = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');

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

            {/* Search bar */}
            <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-colors">
                    <Search size={13} className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
            <WidgetGrid
                presentTypes={presentTypes}
                onAdd={(type) => {
                    onAdd(type);
                }}
                isAdmin={isAdmin}
                search={search}
            />
        </div>
    );
}
