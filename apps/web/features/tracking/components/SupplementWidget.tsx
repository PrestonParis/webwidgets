'use client';

import { useMemo, useState } from 'react';
import {
    AlertTriangle,
    BarChart3,
    Check,
    Plus,
    ShieldAlert,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { SupplementDefForm } from '@/features/tracking/components/SupplementDefForm';
import { WidgetStat } from '@/features/tracking/components/TrackingSurface';
import { useSupplements } from '@/features/tracking/hooks/useSupplements';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { computeSupplementAnalytics } from '@/features/tracking/lib/supplements/analytics';
import { scheduleLabel } from '@/features/tracking/lib/supplements/schedule';
import type { DueDose } from '@/features/tracking/types/supplementLogs';
import type { Supplement } from '@/features/tracking/types/supplement';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'schedule';

// ── Effectiveness check-in form ───────────────────────────────────────────────

function EffectivenessForm({
    supplements,
    onLog,
}: {
    supplements: Supplement[];
    onLog: (supp: Supplement, rating: number, note: string) => Promise<void>;
}) {
    const [selectedId, setSelectedId] = useState(supplements[0]?.id ?? '');
    const [rating, setRating] = useState(3);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const selected = supplements.find((s) => s.id === selectedId);

    return (
        <div className="space-y-2">
            <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
            >
                {supplements.map((s) => (
                    <option key={s.id} value={s.id}>
                        {s.name}
                    </option>
                ))}
            </select>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-lg transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
                    >
                        ★
                    </button>
                ))}
                <span className="ml-1 text-xs text-zinc-500">{rating}/5</span>
            </div>
            <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (side effects, improvements…)"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
            />
            <button
                type="button"
                disabled={saving || !selected}
                onClick={async () => {
                    if (!selected) return;
                    setSaving(true);
                    try {
                        await onLog(selected, rating, note);
                        setNote('');
                    } finally {
                        setSaving(false);
                    }
                }}
                className="w-full rounded-lg bg-purple-600 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
                {saving ? 'Saving…' : 'Log check-in'}
            </button>
        </div>
    );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export default function SupplementWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const [showLogDose, setShowLogDose] = useState(false);
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
    const todayKey = new Date().toISOString().slice(0, 10);

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
            (d) => d.status !== 'taken',
        )) {
            await logDose(dose, 'taken');
        }
    };

    const logEffectiveness = async (
        supp: Supplement,
        rating: number,
        note: string,
    ) => {
        await handleAdd({
            category: 'supplement',
            entryDate: todayKey,
            metadata: {
                supplementId: supp.id,
                name: supp.name,
                status: 'effectiveness',
                effectiveness: rating,
                outcomeRating: rating,
                notes: note,
            },
            tags: ['effectiveness'],
            source: 'manual',
        });
    };

    return (
        <WidgetShell
            icon={<Check className="h-4 w-4 text-purple-600" />}
            title="Supplements"
            footerHref="/tracking"
            footerLabel="Open supplement dashboard"
            widgetId="supplement-widget"
            widgetType="tracking-supplements"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Supplements"
                />
            }
        >
            <div className="space-y-3">
                {loading && (
                    <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                )}

                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'schedule'] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                                    tab === t
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {t === 'schedule'
                                    ? 'Schedule'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
                    <div className="space-y-3">
                        <SupplementDefForm
                            onSubmit={async (payload) => {
                                await add(payload);
                                setTab('schedule');
                            }}
                            onCancel={() => setTab('schedule')}
                        />
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowLogDose((v) => !v)}
                                className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400"
                            >
                                <Plus className="h-3 w-3" /> Log a dose
                            </button>
                            {showLogDose && (
                                <div className="mt-2">
                                    <QuickEntryForm
                                        initialCategory="supplement"
                                        lockCategory
                                        onSubmit={async (entry) => {
                                            await handleAdd(entry);
                                            setShowLogDose(false);
                                            setTab('history');
                                        }}
                                        onCancel={() => setShowLogDose(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={analytics.history.map((h) => h.date)}
                            accentColor="purple"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {analytics.history.length === 0 ? (
                                <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-500">
                                    No supplement logs yet.
                                </p>
                            ) : (
                                analytics.history.slice(0, 10).map((log) => (
                                    <div
                                        key={log.id}
                                        className={`rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 ${log.date === todayKey ? 'ring-1 ring-purple-400' : ''}`}
                                    >
                                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                            {log.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">
                                            {log.date} · {log.status}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        {/* Effectiveness check-in */}
                        {supplements.length > 0 && (
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
                                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                    Log effectiveness check-in
                                </p>
                                <EffectivenessForm
                                    supplements={supplements}
                                    onLog={logEffectiveness}
                                />
                            </div>
                        )}
                        <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300">
                            {analytics.lowInventory.length} low stock ·{' '}
                            {analytics.expiringSoon.length} expiring soon · $
                            {analytics.costPerMonth.toFixed(2)}/month tracked
                        </p>
                        <p className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <BarChart3 className="mr-1 inline h-3 w-3" />
                            {analytics.effectivenessTrend.length < 3
                                ? 'Not enough effectiveness data yet.'
                                : `Trend check-ins: ${analytics.effectivenessTrend.length}`}
                        </p>
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 text-xs text-amber-800 dark:text-amber-200">
                            <ShieldAlert className="mr-1 inline h-3 w-3" />
                            Verify supplement, medication, pregnancy, and
                            condition interactions with a clinician/pharmacist.
                            {Object.keys(analytics.sideEffectFrequency).length >
                                0 && (
                                <p className="mt-1">
                                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                                    Recent side effects logged.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'schedule' && (
                    <div className="space-y-3">
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
                        <div className="space-y-1">
                            {analytics.dueToday.length === 0 && (
                                <p className="text-xs text-zinc-500">
                                    No schedule for today.
                                </p>
                            )}
                            {analytics.dueToday.slice(0, 6).map((dose) => (
                                <div
                                    key={dose.id}
                                    className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2"
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full shrink-0 ${dose.status === 'taken' ? 'bg-green-500' : dose.overdue ? 'bg-red-500' : 'bg-purple-500'}`}
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
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void logDose(dose)
                                                }
                                                className="shrink-0 text-xs text-purple-600 dark:text-purple-400"
                                            >
                                                Take
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void logDose(
                                                        dose,
                                                        'skipped',
                                                    )
                                                }
                                                className="shrink-0 text-xs text-zinc-400"
                                            >
                                                Skip
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => void markAllDueTaken()}
                            className="w-full rounded-lg bg-purple-600 px-2 py-1.5 text-xs font-medium text-white"
                        >
                            Mark all taken
                        </button>
                        <div className="space-y-1">
                            <p className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500">
                                Weekly schedule
                            </p>
                            {analytics.definitions.slice(0, 5).map((def) => (
                                <p
                                    key={def.id}
                                    className="rounded-lg bg-zinc-50 dark:bg-zinc-800/70 p-2 text-xs text-zinc-600 dark:text-zinc-300"
                                >
                                    {def.name}: {scheduleLabel(def)}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
