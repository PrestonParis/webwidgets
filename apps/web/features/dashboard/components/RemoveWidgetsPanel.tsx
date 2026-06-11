'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Check, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

interface RemoveWidgetsPanelProps {
    layout: WidgetConfig[];
    onArchive: (ids: string[]) => void;
    onRemove: (ids: string[]) => void;
    onClose: () => void;
}

export function RemoveWidgetsPanel({
    layout,
    onArchive,
    onRemove,
    onClose,
}: RemoveWidgetsPanelProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const library = getDashboardWidgetLibrary();
    const active = layout.filter(
        (w) => !w.unpresented && w.containerId !== 'bucket',
    );

    const allSelected = active.length > 0 && selected.size === active.length;

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

    const toggle = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(active.map((w) => w.id)));

    const ids = [...selected];

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Remove Widgets
                </p>
                <div className="flex items-center gap-3">
                    {active.length > 0 && (
                        <button
                            onClick={toggleAll}
                            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        >
                            {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Widget list */}
            <div className="max-h-72 overflow-y-auto py-2">
                {active.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
                        No widgets on the dashboard
                    </p>
                ) : (
                    active.map((widget) => {
                        const entry = library.find(
                            (l) => l.type === widget.type,
                        );
                        const checked = selected.has(widget.id);
                        return (
                            <button
                                key={widget.id}
                                onClick={() => toggle(widget.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                    checked
                                        ? 'bg-red-50 dark:bg-red-950/20'
                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                                )}
                            >
                                {/* Checkbox */}
                                <span
                                    className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                        checked
                                            ? 'border-red-500 bg-red-500 text-white'
                                            : 'border-zinc-300 dark:border-zinc-600',
                                    )}
                                >
                                    {checked && (
                                        <Check size={10} strokeWidth={2} />
                                    )}
                                </span>
                                <span className="text-base shrink-0">
                                    {entry?.emoji ?? '📦'}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                        {entry?.name ?? widget.type}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-100 dark:border-zinc-800 p-3 space-y-2">
                {selected.size > 0 && (
                    <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mb-1">
                        {selected.size}{' '}
                        {selected.size === 1 ? 'widget' : 'widgets'} selected
                    </p>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (ids.length === 0) return;
                            onArchive(ids);
                            onClose();
                        }}
                        disabled={ids.length === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Archive size={12} />
                        Archive to Bucket
                    </button>
                    <button
                        onClick={() => {
                            if (ids.length === 0) return;
                            onRemove(ids);
                            onClose();
                        }}
                        disabled={ids.length === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Trash2 size={12} />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
