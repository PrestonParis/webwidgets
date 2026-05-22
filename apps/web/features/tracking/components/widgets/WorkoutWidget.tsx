'use client';

import { useState } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingStats } from '@/features/tracking/hooks/useTrackingStats';
import { StreakCard } from '@/features/tracking/viz/StreakCard';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import {
    formatMetadataDisplay,
    formatDate,
} from '@/features/tracking/lib/trackingUtils';

export default function WorkoutWidget() {
    const [showForm, setShowForm] = useState(false);
    const { entries, refetch } = useTrackingEntries({
        category: 'workout',
        limit: 5,
    });
    const { handleAdd } = useTrackingActions(refetch);
    const stats = useTrackingStats(entries, 'workout');

    return (
        <WidgetShell
            icon={<span className="text-base">🏋️</span>}
            title="Workouts"
            footerHref="/tracking"
            footerLabel="View all →"
            widgetId="workout-widget"
            widgetType="tracking-workout"
        >
            <div className="space-y-3">
                <StreakCard
                    current={stats.currentStreak}
                    longest={stats.longestStreak}
                    label="Workouts"
                    emoji="🏋️"
                />

                <div className="space-y-1">
                    {entries.slice(0, 3).map((e) => (
                        <div
                            key={e.id}
                            className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2"
                        >
                            <p className="text-[10px] text-orange-400 dark:text-orange-300">
                                {formatDate(e.entryDate)}
                            </p>
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-200 truncate">
                                {formatMetadataDisplay('workout', e.metadata)}
                            </p>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            No workouts logged yet.
                        </p>
                    )}
                </div>

                {showForm ? (
                    <QuickEntryForm
                        initialCategory="workout"
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full text-xs py-1.5 rounded-lg border border-dashed border-orange-200 dark:border-orange-800 text-orange-400 hover:border-orange-400 transition-colors"
                    >
                        + Log workout
                    </button>
                )}
            </div>
        </WidgetShell>
    );
}
