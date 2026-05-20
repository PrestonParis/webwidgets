'use client';

import { useState, useMemo } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { formatMetadataDisplay } from '@/features/tracking/lib/trackingUtils';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function MealWidget() {
    const [showForm, setShowForm] = useState(false);
    const { entries, refetch } = useTrackingEntries({
        category: 'meal',
        limit: 20,
    });
    const { handleAdd } = useTrackingActions(refetch);

    const today = todayKey();
    const todayEntries = useMemo(
        () => entries.filter((e) => e.entryDate === today),
        [entries, today],
    );

    const totalProtein = useMemo(
        () =>
            todayEntries.reduce((sum, e) => {
                const p = e.metadata['protein'];
                return typeof p === 'number' ? sum + p : sum;
            }, 0),
        [todayEntries],
    );

    return (
        <WidgetShell
            icon={<span className="text-base">🍽️</span>}
            title="Meals"
            footerHref="/tracking"
            footerLabel="View all →"
            widgetId="meal-widget"
            widgetType="tracking-meal"
        >
            <div className="space-y-3">
                <div className="flex gap-3">
                    <div className="text-center">
                        <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                            {todayEntries.length}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Today
                        </p>
                    </div>
                    {totalProtein > 0 && (
                        <div className="text-center">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {totalProtein}g
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                Protein
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    {todayEntries.map((e) => (
                        <div
                            key={e.id}
                            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2"
                        >
                            <p className="text-xs font-medium text-green-700 dark:text-green-200 truncate">
                                {formatMetadataDisplay('meal', e.metadata)}
                            </p>
                        </div>
                    ))}
                    {todayEntries.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            Nothing logged today.
                        </p>
                    )}
                </div>

                {showForm ? (
                    <QuickEntryForm
                        initialCategory="meal"
                        onSubmit={async (e) => {
                            await handleAdd(e);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full text-xs py-1.5 rounded-lg border border-dashed border-green-200 dark:border-green-800 text-green-500 hover:border-green-400 transition-colors"
                    >
                        + Log meal
                    </button>
                )}
            </div>
        </WidgetShell>
    );
}
