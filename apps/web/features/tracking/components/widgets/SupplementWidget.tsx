'use client';

import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, Check, Clock, Trash2 } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useSupplements } from '@/features/tracking/hooks/useSupplements';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { SupplementDefForm } from '@/features/tracking/components/widgets/SupplementDefForm';
import {
    formatScheduleLabel,
    getCurrentWarning,
    getLogWarning,
    warningMessage,
    warningShort,
} from '@/features/tracking/lib/supplementSchedule';
import type { Supplement } from '@/features/tracking/types/supplement';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function SupplementWidget() {
    const [showForm, setShowForm] = useState(false);
    const [pendingLog, setPendingLog] = useState<Supplement | null>(null);
    const { supplements, loading, add, remove } = useSupplements();
    const { entries, refetch } = useTrackingEntries({
        category: 'supplement',
        limit: 60,
    });
    const { handleAdd } = useTrackingActions(refetch);

    // Map supplement name → loggedAt for today's entries
    const todayLogMap = useMemo(() => {
        const today = todayKey();
        const map = new Map<string, string>();
        for (const e of entries) {
            if (e.entryDate !== today) continue;
            const name =
                typeof e.metadata['name'] === 'string'
                    ? e.metadata['name']
                    : '';
            if (name && !map.has(name)) map.set(name, e.loggedAt);
        }
        return map;
    }, [entries]);

    const logSupplement = async (supp: Supplement) => {
        await handleAdd({
            category: 'supplement',
            entryDate: todayKey(),
            metadata: {
                name: supp.name,
                ...(supp.dose && { dose: supp.dose }),
                taken: true,
            },
            tags: [],
            source: 'manual',
        });
        setPendingLog(null);
    };

    const handleLogClick = (supp: Supplement) => {
        if (getCurrentWarning(supp)) {
            setPendingLog(supp);
        } else {
            void logSupplement(supp);
        }
    };

    return (
        <WidgetShell
            icon={<span className="text-base">💊</span>}
            title="Supplements"
            footerHref="/tracking"
            footerLabel="View all →"
            widgetId="supplement-widget"
            widgetType="tracking-supplements"
        >
            <div className="space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : supplements.length === 0 && !showForm ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                            No supplements added yet.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="text-xs text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium"
                        >
                            + Add your first supplement
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {supplements.map((supp) => {
                            const loggedAt = todayLogMap.get(supp.name);
                            const isTaken = loggedAt !== undefined;
                            const logWarn = isTaken
                                ? getLogWarning(supp, loggedAt)
                                : null;
                            const currWarn = !isTaken
                                ? getCurrentWarning(supp)
                                : null;

                            return (
                                <li
                                    key={supp.id}
                                    className="group flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                                {supp.name}
                                            </span>
                                            {supp.dose && (
                                                <span className="text-[10px] text-zinc-400 shrink-0">
                                                    {supp.dose}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                            <Clock
                                                size={9}
                                                className="text-zinc-400 shrink-0"
                                            />
                                            <span className="text-[10px] text-zinc-400">
                                                {formatScheduleLabel(supp)}
                                            </span>
                                            {logWarn && (
                                                <span className="text-[10px] text-amber-500 flex items-center gap-0.5 shrink-0">
                                                    <AlertTriangle size={9} />
                                                    {warningShort(logWarn)}
                                                </span>
                                            )}
                                            {currWarn === 'overdue' && (
                                                <span className="text-[10px] text-red-400 flex items-center gap-0.5 shrink-0">
                                                    <AlertTriangle size={9} />{' '}
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isTaken ? (
                                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                            <Check
                                                size={11}
                                                className="text-purple-600 dark:text-purple-400"
                                            />
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleLogClick(supp)}
                                            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                        >
                                            Log
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            void remove(supp.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 shrink-0"
                                        aria-label="Remove supplement"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {pendingLog && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle
                                size={13}
                                className="text-amber-500 shrink-0 mt-0.5"
                            />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                {warningMessage(
                                    getCurrentWarning(pendingLog) ?? 'overdue',
                                    pendingLog,
                                )}
                                . Log anyway?
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    void logSupplement(pendingLog);
                                }}
                                className="flex-1 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Log anyway
                            </button>
                            <button
                                onClick={() => setPendingLog(null)}
                                className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showForm ? (
                    <SupplementDefForm
                        onSubmit={async (payload) => {
                            await add(payload);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    supplements.length > 0 && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full text-xs py-1.5 rounded-xl border border-dashed border-purple-200 dark:border-purple-800 text-purple-400 hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Plus size={11} />
                            Add supplement
                        </button>
                    )
                )}
            </div>
        </WidgetShell>
    );
}
