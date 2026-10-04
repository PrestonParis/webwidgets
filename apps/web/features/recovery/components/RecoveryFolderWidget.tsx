'use client';

import { ChevronRight, Heart } from 'lucide-react';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';

// Row shape returned by recoveryAdapter (flat MappedRow.data)
interface TrackerRow {
    id: string;
    addiction: string;
    start_time: string;
    created_at: string;
}

function trackerDays(t: TrackerRow): number {
    return Math.floor(
        (Date.now() - new Date(t.start_time).getTime()) / 86400000,
    );
}

interface RecoveryFolderWidgetProps {
    onOpen: () => void;
}

export default function RecoveryFolderWidget({
    onOpen,
}: RecoveryFolderWidgetProps) {
    // Read from the recovery_records adapter via the runtime manifest.
    // The adapter now joins the relapses table so start_time is authoritative.
    const { payload, loading } = useWidgetData('recovery-folder', 'recovery');

    const trackers: TrackerRow[] = (
        (payload?.sources['recovery_records']?.data as TrackerRow[] | null) ??
        []
    ).filter(
        (t): t is TrackerRow =>
            t != null &&
            typeof t.id === 'string' &&
            typeof t.start_time === 'string',
    );

    return (
        <div className="group relative rounded-3xl border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col min-h-40 p-6 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md hover:bg-white/85 dark:hover:bg-zinc-950/85">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                        <Heart className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                        Recovery Trackers
                    </span>
                </div>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {loading ? '…' : `${trackers.length}`}
                </span>
            </div>

            <div className="space-y-1.5 cursor-pointer flex-1" onClick={onOpen}>
                {!loading && trackers.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                        No trackers yet · visit /recovery to create one
                    </p>
                ) : (
                    <>
                        {trackers.slice(0, 5).map((t) => (
                            <div
                                key={t.id}
                                className="flex items-center justify-between gap-2 text-xs"
                            >
                                <span className="text-zinc-600 dark:text-zinc-300 truncate">
                                    {t.addiction}
                                </span>
                                <span className="shrink-0 font-semibold text-purple-500 dark:text-purple-400">
                                    {trackerDays(t)}d
                                </span>
                            </div>
                        ))}
                        {trackers.length > 5 && (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                +{trackers.length - 5} more
                            </p>
                        )}
                    </>
                )}
            </div>

            <button
                onClick={onOpen}
                className="mt-4 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
                Open trackers <ChevronRight size={12} />
            </button>
        </div>
    );
}
