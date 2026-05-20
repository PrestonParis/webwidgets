'use client';

import { useState } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { TrendSummary } from '@/features/tracking/viz/TrendSummary';
import {
    calcTrend,
    extractMetricSeries,
} from '@/features/tracking/lib/analyticsEngine';
import { MOOD_EMOJIS, MOOD_LABELS } from '@/features/tracking/labels';

export default function MoodTrackingWidget() {
    const [showForm, setShowForm] = useState(false);
    const { entries, refetch } = useTrackingEntries({
        category: 'mood',
        limit: 60,
    });
    const { handleAdd } = useTrackingActions(refetch);

    const latest = entries[0];
    const latestScore =
        typeof latest?.metadata['score'] === 'number'
            ? latest.metadata['score']
            : null;

    const moodSeries = extractMetricSeries(entries, 'mood', 'score');
    const trend = moodSeries.length > 6 ? calcTrend(moodSeries, 'week') : null;

    return (
        <WidgetShell
            icon={<span className="text-base">🧠</span>}
            title="Mood"
            footerHref="/tracking"
            footerLabel="View all →"
            widgetId="mood-tracking-widget"
            widgetType="tracking-mood"
        >
            <div className="space-y-3">
                {latestScore !== null && (
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">
                            {MOOD_EMOJIS[latestScore]}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                                {MOOD_LABELS[latestScore]}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                Latest mood
                            </p>
                        </div>
                    </div>
                )}

                {trend && <TrendSummary trend={trend} metric="Mood" />}

                {!latestScore && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        No mood entries yet.
                    </p>
                )}

                {showForm ? (
                    <QuickEntryForm
                        initialCategory="mood"
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full text-xs py-1.5 rounded-lg border border-dashed border-pink-200 dark:border-pink-900 text-pink-400 hover:border-pink-400 transition-colors"
                    >
                        + Log mood
                    </button>
                )}
            </div>
        </WidgetShell>
    );
}
