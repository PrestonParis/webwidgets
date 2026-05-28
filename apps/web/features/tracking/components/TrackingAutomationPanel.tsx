'use client';

import { TRACKING_ACTIONS } from '@/features/tracking/actions/trackingActions';
import { buildTrackingAutomationRules } from '@/features/tracking/lib/trackingAutomations';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

interface TrackingAutomationPanelProps {
    entries: TrackingEntry[];
    customDefs: CustomCategoryDef[];
}

export function TrackingAutomationPanel({
    entries,
    customDefs,
}: TrackingAutomationPanelProps) {
    const rules = buildTrackingAutomationRules(entries, customDefs);
    const enabled = rules.filter((rule) => rule.enabled).length;

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Automation layer
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-zinc-100">
                        Rules waiting for triggers
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-emerald-500 dark:text-emerald-300">
                        {enabled}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        enabled
                    </p>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                {rules.slice(0, 6).map((rule) => (
                    <div
                        key={rule.id}
                        className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                {rule.label}
                            </p>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] ${
                                    rule.enabled
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400'
                                }`}
                            >
                                {rule.enabled ? 'Enabled' : 'Learning'}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                            {rule.action.label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-100 pt-3 dark:border-zinc-800">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Callable widget actions
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {TRACKING_ACTIONS.map((action) => (
                        <span
                            key={action.id}
                            className="rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                            {action.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
