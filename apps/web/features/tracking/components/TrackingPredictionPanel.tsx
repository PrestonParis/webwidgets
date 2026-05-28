'use client';

import { generateTrackingPredictions } from '@/features/tracking/lib/trackingPredictions';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

interface TrackingPredictionPanelProps {
    entries: TrackingEntry[];
    customDefs: CustomCategoryDef[];
}

export function TrackingPredictionPanel({
    entries,
    customDefs,
}: TrackingPredictionPanelProps) {
    const predictions = generateTrackingPredictions(entries, customDefs);

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Prediction hooks
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-zinc-100">
                        Deterministic for now, ML-ready later
                    </h3>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    {predictions.length} signals
                </span>
            </div>

            {predictions.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                    Log a few overlapping signals to unlock consistency, drift,
                    recovery, and correlation predictions.
                </div>
            ) : (
                <div className="grid gap-2 md:grid-cols-2">
                    {predictions.slice(0, 6).map((prediction) => (
                        <div
                            key={prediction.id}
                            className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                    {prediction.label}
                                </p>
                                <span className="text-[10px] text-indigo-500 dark:text-indigo-300">
                                    {Math.round(prediction.confidence * 100)}%
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">
                                {prediction.reason}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
