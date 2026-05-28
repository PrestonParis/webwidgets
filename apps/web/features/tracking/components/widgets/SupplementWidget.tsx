'use client';

import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    BarChart3,
    Boxes,
    Check,
    Clock,
    FileUp,
    Plus,
    ShieldAlert,
    SkipForward,
    Star,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { SupplementDefForm } from '@/features/tracking/components/widgets/SupplementDefForm';
import {
    QuickActionButton,
    WidgetStat,
} from '@/features/tracking/components/TrackingSurface';
import { useSupplements } from '@/features/tracking/hooks/useSupplements';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { computeSupplementAnalytics } from '@/features/tracking/lib/supplements/analytics';
import { scheduleLabel } from '@/features/tracking/lib/supplements/schedule';
import type { DueDose } from '@/features/tracking/types/supplementLogs';

type ViewMode =
    | 'add'
    | 'log'
    | 'due'
    | 'skip'
    | 'scan'
    | 'refill'
    | 'today'
    | 'schedule'
    | 'history'
    | 'inventory'
    | 'effectiveness'
    | 'safety';

export default function SupplementWidget() {
    const [mode, setMode] = useState<ViewMode>('add');
    const { supplements, loading, add } = useSupplements();
    const { entries, refetch } = useTrackingEntries({
        category: 'supplement',
        limit: 120,
    });
    const { handleAdd } = useTrackingActions(refetch);
    const analytics = useMemo(
        () => computeSupplementAnalytics(supplements, entries),
        [supplements, entries],
    );

    const logDose = async (
        dose: DueDose,
        status: 'taken' | 'skipped' = 'taken',
    ) => {
        await handleAdd({
            category: 'supplement',
            entryDate: dose.date,
            metadata: {
                supplementId: dose.supplement.id,
                name: dose.supplement.name,
                brand: dose.supplement.brand,
                dose: dose.supplement.servingSize,
                doseAmount: dose.supplement.doseAmount,
                doseUnit: dose.supplement.doseUnit,
                time: dose.time,
                status,
                taken: status === 'taken',
                ...(status === 'skipped' && {
                    skipReason: 'Skipped from widget',
                }),
            },
            tags: [],
            source: 'manual',
        });
    };

    const markAllDueTaken = async () => {
        for (const dose of analytics.dueToday.filter(
            (item) => item.status !== 'taken',
        )) {
            await logDose(dose, 'taken');
        }
    };

    return (
        <WidgetShell
            icon={<Star className="h-4 w-4 text-purple-600" />}
            title="Supplements"
            footerHref="/tracking"
            footerLabel="Open supplement dashboard"
            widgetId="supplement-widget"
            widgetType="tracking-supplements"
        >
            <div className="space-y-3">
                {loading ? (
                    <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ) : analytics.definitions.length === 0 && mode !== 'add' ? (
                    <div className="rounded-xl border border-dashed border-purple-200 dark:border-purple-800 p-3 text-center">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            No supplements yet
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Add a supplement, create a schedule, or import a
                            CSV.
                        </p>
                    </div>
                ) : mode === 'today' ? (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <WidgetStat
                                label="Due today"
                                value={String(analytics.dueToday.length)}
                            />
                            <WidgetStat
                                label="Taken"
                                value={String(analytics.takenToday)}
                            />
                            <WidgetStat
                                label="Overdue"
                                value={String(analytics.overdueCount)}
                            />
                        </div>
                        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/70 p-2">
                            <p className="text-[10px] text-zinc-500">
                                Next dose
                            </p>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {analytics.nextDose
                                    ? `${analytics.nextDose.supplement.name} at ${analytics.nextDose.time}`
                                    : 'No upcoming doses'}
                            </p>
                        </div>
                    </>
                ) : null}

                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'add'}
                        onClick={() => setMode('add')}
                    >
                        <Plus className="h-3 w-3" /> Add
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'log'}
                        onClick={() => setMode('log')}
                    >
                        <Check className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'due'}
                        onClick={() => setMode('due')}
                    >
                        <Clock className="h-3 w-3" /> Due
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'skip'}
                        onClick={() => setMode('skip')}
                    >
                        <SkipForward className="h-3 w-3" /> Skip
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'scan'}
                        onClick={() => setMode('scan')}
                    >
                        <FileUp className="h-3 w-3" /> Scan
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'refill'}
                        onClick={() => setMode('refill')}
                    >
                        <Boxes className="h-3 w-3" /> Refill
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'today'}
                        onClick={() => setMode('today')}
                    >
                        Today
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'schedule'}
                        onClick={() => setMode('schedule')}
                    >
                        Schedule
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'history'}
                        onClick={() => setMode('history')}
                    >
                        History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'inventory'}
                        onClick={() => setMode('inventory')}
                    >
                        Inventory
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'effectiveness'}
                        onClick={() => setMode('effectiveness')}
                    >
                        Effectiveness
                    </QuickActionButton>
                    <QuickActionButton
                        tone="purple"
                        primary={mode === 'safety'}
                        onClick={() => setMode('safety')}
                    >
                        Safety
                    </QuickActionButton>
                </div>

                {mode === 'add' && (
                    <SupplementDefForm
                        onSubmit={async (payload) => {
                            await add(payload);
                            setMode('today');
                        }}
                        onCancel={() => setMode('today')}
                    />
                )}
                {mode === 'log' && (
                    <QuickEntryForm
                        initialCategory="supplement"
                        lockCategory
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setMode('today');
                        }}
                        onCancel={() => setMode('today')}
                    />
                )}
                {mode === 'due' && (
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => void markAllDueTaken()}
                            className="w-full rounded-lg bg-purple-600 px-2 py-1.5 text-xs font-medium text-white"
                        >
                            Mark all due taken
                        </button>
                        {analytics.dueToday.length === 0 && (
                            <p className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-500 dark:bg-zinc-800/70">
                                No doses due today.
                            </p>
                        )}
                        {analytics.dueToday.slice(0, 5).map((dose) => (
                            <p
                                key={dose.id}
                                className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"
                            >
                                {dose.supplement.name} · {dose.time} ·{' '}
                                {dose.status}
                            </p>
                        ))}
                    </div>
                )}
                {mode === 'skip' && (
                    <div className="space-y-1">
                        {analytics.dueToday.filter(
                            (dose) => dose.status !== 'taken',
                        ).length === 0 && (
                            <p className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-500 dark:bg-zinc-800/70">
                                No untaken doses to skip.
                            </p>
                        )}
                        {analytics.dueToday
                            .filter((dose) => dose.status !== 'taken')
                            .slice(0, 5)
                            .map((dose) => (
                                <button
                                    key={dose.id}
                                    type="button"
                                    onClick={() =>
                                        void logDose(dose, 'skipped')
                                    }
                                    className="w-full rounded-lg bg-zinc-50 p-2 text-left text-xs text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300"
                                >
                                    Skip {dose.supplement.name} at {dose.time}
                                </button>
                            ))}
                    </div>
                )}
                {mode === 'scan' && (
                    <p className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                        Supplement label scanning is available from the full
                        supplement dashboard.
                    </p>
                )}
                {mode === 'refill' && (
                    <p className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                        {analytics.lowInventory.length} low-stock supplements
                        need refill review.
                    </p>
                )}

                {mode === 'today' && (
                    <div className="space-y-1">
                        {analytics.dueToday.length === 0 && (
                            <p className="text-xs text-zinc-500">
                                No schedule for today.
                            </p>
                        )}
                        {analytics.dueToday.slice(0, 5).map((dose) => (
                            <div
                                key={dose.id}
                                className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2"
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${dose.status === 'taken' ? 'bg-green-500' : dose.overdue ? 'bg-red-500' : 'bg-purple-500'}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                        {dose.supplement.name}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {dose.time} · {dose.status}
                                        {dose.overdue ? ' · overdue' : ''}
                                    </p>
                                </div>
                                {dose.status !== 'taken' && (
                                    <button
                                        type="button"
                                        onClick={() => void logDose(dose)}
                                        className="text-xs text-purple-600"
                                    >
                                        Take
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {mode === 'schedule' && (
                    <div className="space-y-1">
                        {analytics.definitions.slice(0, 5).map((definition) => (
                            <p
                                key={definition.id}
                                className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300"
                            >
                                {definition.name}: {scheduleLabel(definition)}
                            </p>
                        ))}
                    </div>
                )}
                {mode === 'history' && (
                    <div className="space-y-1">
                        {analytics.history.slice(0, 5).map((log) => (
                            <p
                                key={log.id}
                                className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300"
                            >
                                {log.date} · {log.name} · {log.status}
                            </p>
                        ))}
                    </div>
                )}
                {mode === 'inventory' && (
                    <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300">
                        {analytics.lowInventory.length} low stock ·{' '}
                        {analytics.expiringSoon.length} expiring soon · $
                        {analytics.costPerMonth.toFixed(2)}/month tracked
                    </p>
                )}
                {mode === 'effectiveness' && (
                    <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <BarChart3 className="mr-1 inline h-3 w-3" />{' '}
                        {analytics.effectivenessTrend.length < 3
                            ? 'Not enough effectiveness data yet.'
                            : `Trend check-ins: ${analytics.effectivenessTrend.length}`}
                    </p>
                )}
                {mode === 'safety' && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-xs text-amber-800 dark:text-amber-200">
                        <ShieldAlert className="mr-1 inline h-3 w-3" />
                        Verify supplement, medication, pregnancy, and condition
                        interactions with a clinician/pharmacist.
                        {Object.keys(analytics.sideEffectFrequency).length >
                            0 && (
                            <p className="mt-1">
                                <AlertTriangle className="mr-1 inline h-3 w-3" />
                                Recent side effects logged.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
