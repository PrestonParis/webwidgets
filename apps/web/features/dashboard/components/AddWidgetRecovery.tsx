'use client';

import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import type { Tracker } from '@/features/recovery/types/recovery';

interface RecoveryTrackerSectionProps {
    presentTrackerIds: Set<string>;
    onAddTracker: (tracker: Tracker) => void;
    onAddAllTrackers: (trackers: Tracker[]) => void;
}

export function RecoveryTrackerSection({
    presentTrackerIds,
    onAddTracker,
    onAddAllTrackers,
}: RecoveryTrackerSectionProps) {
    const { trackers } = useTrackers();
    if (!trackers || trackers.length === 0) return null;
    const unadded = trackers.filter((t) => !presentTrackerIds.has(t.id));
    const allAdded = unadded.length === 0;
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
                        onClick={() => onAddAllTrackers(unadded)}
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
