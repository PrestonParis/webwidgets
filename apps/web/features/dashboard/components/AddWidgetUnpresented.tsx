'use client';

import { Plus } from 'lucide-react';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

interface UnpresentedSectionProps {
    unpresented: WidgetConfig[];
    onRestore: (id: string) => void;
}

export function UnpresentedSection({
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
