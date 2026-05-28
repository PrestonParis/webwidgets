'use client';

import { useDashboardRuntime } from '@/features/dashboard/runtime/DashboardRuntimeProvider';

export function DashboardRuntimeControls() {
    const { snapshot, loadMore } = useDashboardRuntime();
    if (snapshot.registered <= snapshot.loaded && !snapshot.paused) return null;

    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white/80 px-4 py-3 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
            <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                    Widgets {snapshot.loaded}/{snapshot.registered}
                </span>
                <span>Visible {snapshot.visible}</span>
                <span>Active fetches {snapshot.activeFetches}</span>
                {snapshot.failed > 0 && (
                    <span className="text-red-600 dark:text-red-300">
                        Failed {snapshot.failed}
                    </span>
                )}
                {snapshot.paused && (
                    <span className="text-amber-700 dark:text-amber-300">
                        Loading paused
                    </span>
                )}
            </div>
            {snapshot.registered > snapshot.loaded && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                    Load more widgets
                </button>
            )}
        </div>
    );
}
