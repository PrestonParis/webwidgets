'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';

interface FloatingBucketProps {
    layout: WidgetConfig[];
    onRestore: (id: string) => void;
    onRemove: (id: string) => void;
}

export function FloatingBucket({
    layout,
    onRestore,
    onRemove,
}: FloatingBucketProps) {
    const [hovered, setHovered] = useState(false);

    const bucketed = layout.filter((w) => w.containerId === 'bucket');

    function widgetLabel(w: WidgetConfig) {
        const entry = getDashboardWidgetLibrary().find(
            (c) => c.type === w.type,
        );
        return entry ? `${entry.emoji} ${entry.name}` : w.type;
    }

    return (
        <div
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Expanded panel */}
            <div
                className={cn(
                    'transition-all duration-300 ease-out overflow-hidden',
                    hovered
                        ? 'w-56 opacity-100'
                        : 'w-0 opacity-0 pointer-events-none',
                )}
            >
                <div className="w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-l-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Widget Bucket
                        </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto no-scrollbar">
                        {bucketed.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-zinc-400 dark:text-zinc-600">
                                <Archive size={18} className="opacity-40" />
                                <p className="text-xs">Empty bucket</p>
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
                                                <ArchiveRestore size={12} />
                                            </button>
                                            <button
                                                onClick={() => onRemove(w.id)}
                                                title="Remove permanently"
                                                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab handle */}
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-4 px-1.5 rounded-l-xl cursor-pointer transition-all duration-300 select-none',
                    hovered
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-r-0 border-gray-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                )}
            >
                <Archive size={14} />
                {bucketed.length > 0 && (
                    <span
                        className={cn(
                            'text-[9px] font-bold min-w-3.5 text-center',
                            hovered
                                ? 'text-white dark:text-zinc-900'
                                : 'text-zinc-500 dark:text-zinc-400',
                        )}
                    >
                        {bucketed.length}
                    </span>
                )}
            </div>
        </div>
    );
}
