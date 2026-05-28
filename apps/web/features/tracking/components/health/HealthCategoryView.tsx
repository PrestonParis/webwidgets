'use client';

import { useMemo, useState } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import { GraphView } from '@/features/tracking/components/views/GraphView';
import { StatsView } from '@/features/tracking/components/views/StatsView';
import { TimelineView } from '@/features/tracking/components/views/TimelineView';
import {
    SurfaceTabs,
    TrackingHero,
    TrackingKpi,
    TrackingSection,
} from '@/features/tracking/components/TrackingSurface';
import {
    calcTrend,
    extractMetricSeries,
} from '@/features/tracking/lib/analyticsEngine';
import {
    formatDate,
    formatMetadataDisplay,
} from '@/features/tracking/lib/trackingUtils';
import type {
    TrackingEntry,
    BaseTrackingEntry,
} from '@/features/tracking/types/trackingEntryTypes';

type HealthTab = 'history' | 'trends' | 'stats' | 'goals';

const TABS: Array<{ id: HealthTab; label: string }> = [
    { id: 'history', label: 'History' },
    { id: 'trends', label: 'Trends' },
    { id: 'stats', label: 'Stats' },
    { id: 'goals', label: 'Goals' },
];

interface HealthCategoryViewProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onUpdate: (
        id: string,
        updates: Partial<BaseTrackingEntry>,
    ) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

export function HealthCategoryView({
    entries,
    onEdit,
    onDelete,
}: HealthCategoryViewProps) {
    const [activeTab, setActiveTab] = useState<HealthTab>('history');
    const latest = entries[0];

    const series = useMemo(
        () => extractMetricSeries(entries, 'health', 'value'),
        [entries],
    );
    const trend = series.length > 6 ? calcTrend(series, 'week') : null;
    const weekCount = entries.filter((entry) => {
        const date = new Date(`${entry.entryDate}T00:00:00`);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 6);
        cutoff.setHours(0, 0, 0, 0);
        return date >= cutoff;
    }).length;

    return (
        <div className="space-y-4">
            <TrackingHero
                eyebrow="Health dashboard"
                title={
                    latest
                        ? formatMetadataDisplay('health', latest.metadata)
                        : 'Ready for your first health log'
                }
                subtitle={
                    latest
                        ? `${formatDate(latest.entryDate)}`
                        : 'Track health metrics, vitals, and trends.'
                }
                tone="green"
                actions={
                    <button
                        type="button"
                        onClick={() => latest && onEdit(latest)}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        disabled={!latest}
                    >
                        <Activity className="h-3.5 w-3.5" /> Edit latest
                    </button>
                }
                kpis={
                    <>
                        <TrackingKpi
                            label="This week"
                            value={String(weekCount)}
                            sub="Health logs"
                        />
                        <TrackingKpi
                            label="Trend"
                            value={trend ? trend.direction : 'Not enough data'}
                            sub={
                                trend
                                    ? `${Math.round(trend.magnitude * 100)}%`
                                    : undefined
                            }
                        />
                        <TrackingKpi
                            label="Total"
                            value={String(entries.length)}
                            sub="Newest first"
                        />
                    </>
                }
            />

            <SurfaceTabs
                items={TABS}
                active={activeTab}
                onChange={setActiveTab}
                tone="green"
            />

            {activeTab === 'history' && (
                <TrackingSection>
                    <div className="space-y-2">
                        {entries.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No health entries yet.
                            </p>
                        )}
                        {entries.slice(0, 30).map((entry) => (
                            <div
                                key={entry.id}
                                className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/70"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                            {formatMetadataDisplay(
                                                'health',
                                                entry.metadata,
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            {formatDate(entry.entryDate)}
                                            {entry.notes
                                                ? ` · ${entry.notes}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(entry)}
                                            className="text-xs text-indigo-500"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(entry.id)}
                                            className="text-xs text-red-500"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TrackingSection>
            )}
            {activeTab === 'trends' && (
                <TrackingSection>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <BarChart3 className="h-4 w-4 text-green-500" /> Health
                        trend
                    </div>
                    {entries.length < 2 ? (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            Not enough data yet.
                        </p>
                    ) : (
                        <GraphView entries={entries} category="health" />
                    )}
                </TrackingSection>
            )}
            {activeTab === 'stats' && (
                <TrackingSection>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <Activity className="h-4 w-4 text-green-500" /> Health
                        stats
                    </div>
                    <StatsView entries={entries} category="health" />
                </TrackingSection>
            )}
            {activeTab === 'goals' && <GoalSettingsPanel category="health" />}
            {activeTab === 'history' && entries.length > 0 && (
                <TrackingSection>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Timeline
                    </h3>
                    <div className="mt-3">
                        <TimelineView
                            entries={entries.slice(0, 12)}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                </TrackingSection>
            )}
        </div>
    );
}
