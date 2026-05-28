'use client';

import {
    buildTrackingOverview,
    generateTrackingInsights,
    suggestAutomationTriggers,
} from '@/features/tracking/lib/trackingIntelligence';
import {
    getAllTrackingCategoryConfigs,
    getCategoryColor,
} from '@/features/tracking/constants';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

interface TrackingIntelligenceDashboardProps {
    entries: TrackingEntry[];
    selectedCategory: string;
    customDefs: CustomCategoryDef[];
    onSelectCategory: (category: string) => void;
    onOpenInsights: () => void;
    onOpenCorrelations: () => void;
}

const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-300',
    orange: 'from-orange-500/20 to-amber-500/10 text-orange-300',
    green: 'from-green-500/20 to-emerald-500/10 text-green-300',
    pink: 'from-pink-500/20 to-rose-500/10 text-pink-300',
    purple: 'from-purple-500/20 to-violet-500/10 text-purple-300',
    amber: 'from-amber-500/20 to-yellow-500/10 text-amber-300',
    red: 'from-red-500/20 to-rose-500/10 text-red-300',
    indigo: 'from-indigo-500/20 to-blue-500/10 text-indigo-300',
};

export function TrackingIntelligenceDashboard({
    entries,
    selectedCategory,
    customDefs,
    onSelectCategory,
    onOpenInsights,
    onOpenCorrelations,
}: TrackingIntelligenceDashboardProps) {
    const overview = buildTrackingOverview(entries, customDefs);
    const insights = generateTrackingInsights(entries, customDefs);
    const triggers = suggestAutomationTriggers(entries, customDefs).slice(0, 4);
    const configs = getAllTrackingCategoryConfigs(customDefs);

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                Universal tracking engine
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-zinc-100">
                                Life signal map
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-500 dark:text-indigo-300">
                                {Math.round(overview.coverage * 100)}%
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                                coverage
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Stat
                            label="Total logs"
                            value={overview.totalEntries}
                        />
                        <Stat label="Today" value={overview.entriesToday} />
                        <Stat
                            label="This week"
                            value={overview.entriesThisWeek}
                        />
                        <Stat
                            label="Active areas"
                            value={overview.activeCategoryCount}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {configs.map((config) => {
                            const stats = overview.categoryStats.find(
                                (item) => item.category === config.id,
                            );
                            const active = selectedCategory === config.id;
                            const color =
                                colorClasses[
                                    getCategoryColor(config.id, customDefs)
                                ] ?? colorClasses.indigo;
                            return (
                                <button
                                    key={config.id}
                                    onClick={() => onSelectCategory(config.id)}
                                    className={`text-left rounded-xl border p-3 transition-all bg-gradient-to-br ${color} ${
                                        active
                                            ? 'border-indigo-400 dark:border-indigo-500 shadow-sm'
                                            : 'border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg">
                                            {config.icon}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                            {stats?.weeklyCount ?? 0}/wk
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-gray-800 dark:text-zinc-100 truncate">
                                        {config.label}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {config.metricType} ·{' '}
                                        {config.supports.length} hooks
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Intelligence queue
                        </p>
                        <button
                            onClick={onOpenInsights}
                            className="text-xs text-indigo-500 dark:text-indigo-300 hover:text-indigo-400"
                        >
                            Open
                        </button>
                    </div>
                    {insights.slice(0, 4).map((insight) => (
                        <div
                            key={`${insight.label}-${insight.reason}`}
                            className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3"
                        >
                            <div className="flex justify-between gap-3">
                                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                    {insight.label}
                                </p>
                                <span className="text-[10px] text-indigo-500 dark:text-indigo-300">
                                    {Math.round(insight.confidence * 100)}%
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">
                                {insight.reason}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Automation candidates
                        </p>
                        <span className="text-[10px] text-emerald-500 dark:text-emerald-300">
                            ready for rules
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {triggers.map((trigger) => (
                            <div
                                key={`${trigger.category}-${trigger.label}`}
                                className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3"
                            >
                                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                    {trigger.label}
                                </p>
                                <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                                    {trigger.reason}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Correlation lab
                        </p>
                        <button
                            onClick={onOpenCorrelations}
                            className="text-xs text-indigo-500 dark:text-indigo-300 hover:text-indigo-400"
                        >
                            Review
                        </button>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-zinc-300">
                            Built for sleep, mood, workouts, meals, symptoms,
                            injuries, supplements, and any custom metric you
                            add.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            Current engine uses deterministic statistics. ML
                            providers can replace the prediction layer later
                            without changing the UI contract.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3">
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                {label}
            </p>
        </div>
    );
}
