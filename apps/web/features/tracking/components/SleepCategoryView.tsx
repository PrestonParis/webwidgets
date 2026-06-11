'use client';

import { useState, useMemo } from 'react';
import { LineChart } from '@/features/ui/visualizations/components/LineChart';
import { BarChart } from '@/features/ui/visualizations/components/BarChart';
import { Heatmap } from '@/features/ui/visualizations/components/Heatmap';
import { SleepGoalPanel } from '@/features/tracking/components/SleepGoalPanel';
import {
    SurfaceTabs,
    TrackingHero,
    TrackingKpi,
    TrackingSection,
} from '@/features/tracking/components/TrackingSurface';
import {
    normalizeSleepEntries,
    computeSleepAnalytics,
    sleepDurationColorFn,
    toHeatmapData,
    heatmapWeeks,
    formatDuration,
    sleepRecordSummary,
    type SleepRecord,
} from '@/features/tracking/lib/sleep/sleepDomain';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

type SleepTab = 'history' | 'charts' | 'heatmap' | 'goal';

const TABS: { id: SleepTab; label: string }[] = [
    { id: 'history', label: 'History' },
    { id: 'charts', label: 'Charts' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'goal', label: 'Goal' },
];

const LEGEND = [
    { label: '< 5h', color: '#fca5a5' },
    { label: '6h', color: '#fde68a' },
    { label: '7h', color: '#86efac' },
    { label: '8h+', color: '#22c55e' },
    { label: 'None', color: '#f4f4f5' },
] as const;

// ─── stat card ─────────────────────────────────────────────────────────────────

// ─── sleep history tab ─────────────────────────────────────────────────────────

function SleepHistoryTab({
    records,
    onEdit,
    onDelete,
}: {
    records: SleepRecord[];
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}) {
    if (records.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-10">
                No sleep entries yet.
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {records.map((r) => (
                <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                {r.durationHours !== null
                                    ? formatDuration(r.durationHours)
                                    : 'N/A'}
                            </span>
                            {r.quality !== null && (
                                <span className="text-xs text-gray-400 dark:text-zinc-500">
                                    Q{r.quality}/10
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            {formatDate(r.date)}
                            {r.bedtime &&
                                r.wakeTime &&
                                ` · ${r.bedtime} – ${r.wakeTime}`}
                            {r.notes && ` · ${r.notes}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onEdit(r.raw)}
                            className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                            aria-label={`Edit sleep entry for ${r.date}`}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(r.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            aria-label={`Delete sleep entry for ${r.date}`}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── charts tab ────────────────────────────────────────────────────────────────

function SleepChartsTab({ records }: { records: SleepRecord[] }) {
    const withDuration = records.filter((r) => r.durationHours !== null);

    const barData = useMemo(
        () =>
            withDuration
                .slice(0, 30)
                .reverse()
                .map((r) => ({
                    label: new Date(r.date + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' },
                    ),
                    value: r.durationHours!,
                })),
        [withDuration],
    );

    const lineData = useMemo(
        () =>
            withDuration
                .slice(0, 90)
                .reverse()
                .map((r) => ({ date: r.date, value: r.durationHours! })),
        [withDuration],
    );

    if (withDuration.length < 2) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-10">
                Log at least 2 nights with duration to see charts.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                    Sleep duration (last 30 nights)
                </p>
                <BarChart
                    data={barData}
                    color="#3b82f6"
                    height={180}
                    emptyMessage="Not enough data"
                />
            </div>

            {lineData.length >= 7 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                        Duration trend
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
                        Rolling 90-night view
                    </p>
                    <LineChart
                        data={lineData}
                        color="#6366f1"
                        height={160}
                        emptyMessage="Not enough data"
                    />
                </div>
            )}
        </div>
    );
}

// ─── heatmap tab ───────────────────────────────────────────────────────────────

function SleepHeatmapTab({ records }: { records: SleepRecord[] }) {
    const data = useMemo(() => toHeatmapData(records), [records]);
    const weeks = useMemo(() => heatmapWeeks(records, 24), [records]);

    if (records.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-10">
                No sleep entries yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <Heatmap data={data} weeks={weeks} colorFn={sleepDurationColorFn} />
            <div className="flex items-center gap-4 flex-wrap">
                {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ background: l.color }}
                            aria-hidden
                        />
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {l.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Each cell represents one night. Color indicates duration.
            </p>
        </div>
    );
}

// ─── main component ────────────────────────────────────────────────────────────

interface SleepCategoryViewProps {
    entries: TrackingEntry[];
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

export function SleepCategoryView({
    entries,
    onEdit,
    onDelete,
}: SleepCategoryViewProps) {
    const [activeTab, setActiveTab] = useState<SleepTab>('history');
    const { goal } = useTrackingGoals('sleep');

    const records = useMemo(() => normalizeSleepEntries(entries), [entries]);
    const analytics = useMemo(
        () => computeSleepAnalytics(records, goal),
        [records, goal],
    );

    const { lastRecord, sevenDayAvg, thirtyDayAvg, goalHitRate7d, trend } =
        analytics;

    const trendLabel =
        trend === 'up'
            ? '↑ Improving'
            : trend === 'down'
              ? '↓ Declining'
              : trend === 'stable'
                ? '→ Stable'
                : null;

    return (
        <div className="space-y-4">
            <TrackingHero
                eyebrow="Sleep dashboard"
                title={
                    lastRecord
                        ? formatDuration(lastRecord.durationHours ?? 0)
                        : 'Ready for your first sleep log'
                }
                subtitle={
                    lastRecord
                        ? `${formatDate(lastRecord.date)} · ${sleepRecordSummary(lastRecord)}`
                        : 'Track duration, consistency, quality, and goal progress.'
                }
                tone="blue"
                kpis={
                    <>
                        <TrackingKpi
                            label="Last sleep"
                            value={
                                lastRecord?.durationHours !== null && lastRecord
                                    ? formatDuration(lastRecord.durationHours)
                                    : 'N/A'
                            }
                            sub={
                                lastRecord
                                    ? formatDate(lastRecord.date)
                                    : undefined
                            }
                        />
                        <TrackingKpi
                            label="7-day avg"
                            value={
                                sevenDayAvg !== null
                                    ? formatDuration(sevenDayAvg)
                                    : 'N/A'
                            }
                            sub={trendLabel ?? undefined}
                        />
                        <TrackingKpi
                            label="30-day avg"
                            value={
                                thirtyDayAvg !== null
                                    ? formatDuration(thirtyDayAvg)
                                    : 'N/A'
                            }
                        />
                        <TrackingKpi
                            label="Goal hit (7d)"
                            value={
                                goalHitRate7d !== null
                                    ? `${Math.round(goalHitRate7d * 100)}%`
                                    : goal
                                      ? 'N/A'
                                      : 'No goal'
                            }
                            sub={
                                goal
                                    ? `≥ ${goal.targetValue}h / night`
                                    : undefined
                            }
                        />
                    </>
                }
                progress={
                    goal && goalHitRate7d !== null
                        ? {
                              label: 'Goal progress',
                              valueLabel: `${Math.round(goalHitRate7d * 100)}%`,
                              ratio: goalHitRate7d,
                          }
                        : undefined
                }
            />

            <SurfaceTabs
                items={TABS}
                active={activeTab}
                onChange={setActiveTab}
                tone="blue"
            />

            {activeTab === 'history' && (
                <TrackingSection>
                    <SleepHistoryTab
                        records={records}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </TrackingSection>
            )}
            {activeTab === 'charts' && (
                <TrackingSection>
                    <SleepChartsTab records={records} />
                </TrackingSection>
            )}
            {activeTab === 'heatmap' && (
                <TrackingSection>
                    <SleepHeatmapTab records={records} />
                </TrackingSection>
            )}
            {activeTab === 'goal' && <SleepGoalPanel />}
        </div>
    );
}
