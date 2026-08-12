'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Plus, Smile } from 'lucide-react';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import { GraphView } from '@/features/tracking/components/GraphView';
import { StatsView } from '@/features/tracking/components/StatsView';
import { TimelineView } from '@/features/tracking/components/TimelineView';
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
import { MOOD_LABELS } from '@/features/tracking/labels';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

type MoodTab = 'history' | 'trends' | 'stats' | 'goals';

const TABS: Array<{ id: MoodTab; label: string }> = [
    { id: 'history', label: 'History' },
    { id: 'trends', label: 'Trends' },
    { id: 'stats', label: 'Stats' },
    { id: 'goals', label: 'Goals' },
];

interface MoodCategoryViewProps {
    entries: TrackingEntry[];
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

function moodScore(entry: TrackingEntry | undefined): number | null {
    return typeof entry?.metadata['score'] === 'number'
        ? entry.metadata['score']
        : null;
}

export function MoodCategoryView({
    entries,
    onEdit,
    onDelete,
}: MoodCategoryViewProps) {
    const [activeTab, setActiveTab] = useState<MoodTab>('history');
    const latest = entries[0];
    const latestScore = moodScore(latest);
    const series = useMemo(
        () => extractMetricSeries(entries, 'mood', 'score'),
        [entries],
    );
    const trend = series.length > 6 ? calcTrend(series, 'week') : null;
    const average =
        series.length > 0
            ? series.reduce((sum, item) => sum + item.value, 0) / series.length
            : null;
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
                eyebrow="Mood dashboard"
                title={
                    latestScore
                        ? (MOOD_LABELS[latestScore] ?? 'Mood')
                        : 'Ready for your first mood log'
                }
                subtitle={
                    latest
                        ? `${formatDate(latest.entryDate)} · ${formatMetadataDisplay('mood', latest.metadata)}`
                        : 'Track mood patterns, notes, and trends.'
                }
                tone="pink"
                actions={
                    <button
                        type="button"
                        onClick={() => latest && onEdit(latest)}
                        className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        disabled={!latest}
                    >
                        <Plus className="h-3.5 w-3.5" /> Edit latest
                    </button>
                }
                kpis={
                    <>
                        <TrackingKpi
                            label="This week"
                            value={String(weekCount)}
                            sub="Mood logs"
                        />
                        <TrackingKpi
                            label="Average"
                            value={
                                average !== null
                                    ? `${average.toFixed(1)}/5`
                                    : 'N/A'
                            }
                        />
                        <TrackingKpi
                            label="Latest score"
                            value={
                                latestScore !== null
                                    ? `${latestScore}/5`
                                    : 'N/A'
                            }
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
                progress={
                    average !== null
                        ? {
                              label: 'Average mood',
                              valueLabel: `${average.toFixed(1)}/5`,
                              ratio: average / 5,
                          }
                        : undefined
                }
            />

            <SurfaceTabs
                items={TABS}
                active={activeTab}
                onChange={setActiveTab}
                tone="pink"
            />

            {activeTab === 'history' && (
                <TrackingSection>
                    <div className="space-y-2">
                        {entries.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No mood entries yet.
                            </p>
                        )}
                        {entries.slice(0, 30).map((entry) => {
                            const score = moodScore(entry);
                            return (
                                <div
                                    key={entry.id}
                                    className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/70"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                                {score
                                                    ? MOOD_LABELS[score]
                                                    : formatMetadataDisplay(
                                                          'mood',
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
                                                onClick={() =>
                                                    onDelete(entry.id)
                                                }
                                                className="text-xs text-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TrackingSection>
            )}
            {activeTab === 'trends' && (
                <TrackingSection>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <BarChart3 className="h-4 w-4 text-pink-500" /> Mood
                        trend
                    </div>
                    {entries.length < 2 ? (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            Not enough data yet.
                        </p>
                    ) : (
                        <GraphView entries={entries} category="mood" />
                    )}
                </TrackingSection>
            )}
            {activeTab === 'stats' && (
                <TrackingSection>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <Smile className="h-4 w-4 text-pink-500" /> Mood stats
                    </div>
                    <StatsView entries={entries} category="mood" />
                </TrackingSection>
            )}
            {activeTab === 'goals' && <GoalSettingsPanel category="mood" />}
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
