'use client';

import { useState, useRef, useEffect } from 'react';
import { Archive, ArchiveRestore, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';

interface WidgetBucketProps {
    layout: WidgetConfig[];
    onRestore: (id: string) => void;
    onRemove: (id: string) => void;
}

export function WidgetBucket({
    layout,
    onRestore,
    onRemove,
}: WidgetBucketProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const bucketed = layout.filter((w) => w.containerId === 'bucket');

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function widgetLabel(w: WidgetConfig) {
        const entry = getDashboardWidgetLibrary().find(
            (c) => c.type === w.type,
        );
        return entry ? `${entry.emoji} ${entry.name}` : w.type;
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title="Widget Bucket"
                className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    open
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                )}
            >
                <Archive size={13} />
                <span>Bucket</span>
                {bucketed.length > 0 && (
                    <span
                        className={cn(
                            'ml-0.5 min-w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1',
                            open
                                ? 'bg-white/20 text-white'
                                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
                        )}
                    >
                        {bucketed.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Widget Bucket
                        </p>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto no-scrollbar">
                        {bucketed.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-zinc-400 dark:text-zinc-600">
                                <Archive size={20} className="opacity-40" />
                                <p className="text-xs">Bucket is empty</p>
                                <p className="text-[10px] text-center opacity-60 px-6">
                                    Move lesser-used widgets here to keep your
                                    dashboard clean
                                </p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {bucketed.map((w) => (
                                    <div
                                        key={w.id}
                                        className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 group"
                                    >
                                        <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                                            {widgetLabel(w)}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onRestore(w.id)}
                                                title="Restore to dashboard"
                                                className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                            >
                                                <ArchiveRestore size={13} />
                                            </button>
                                            <button
                                                onClick={() => onRemove(w.id)}
                                                title="Remove permanently"
                                                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
