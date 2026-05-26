'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Barcode,
    Boxes,
    Download,
    FileUp,
    Plus,
    Search,
    ShieldAlert,
    Star,
} from 'lucide-react';
import { QuickEntryForm } from '@/features/tracking/components/QuickEntryForm';
import { GoalSettingsPanel } from '@/features/tracking/components/GoalSettingsPanel';
import { SupplementDefForm } from '@/features/tracking/components/widgets/SupplementDefForm';
import {
    QuickActionButton,
    TrackingHero,
    TrackingKpi,
} from '@/features/tracking/components/TrackingSurface';
import { useSupplements } from '@/features/tracking/hooks/useSupplements';
import { computeSupplementAnalytics } from '@/features/tracking/lib/supplements/analytics';
import { scheduleLabel } from '@/features/tracking/lib/supplements/schedule';
import {
    defaultAllergyProfile,
    detectSupplementWarnings,
} from '@/features/tracking/lib/supplements/safety';
import { searchSupplementLibrary } from '@/features/tracking/lib/supplements/providers/libraryProvider';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/tracking';
import type { SupplementSearchResult } from '@/features/tracking/lib/supplements/types';

interface Props {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

const sectionCls =
    'rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';

export function SupplementsCategoryView({
    entries,
    onAdd,
    onEdit,
    onDelete,
}: Props) {
    const [showLogger, setShowLogger] = useState(false);
    const [showAddSupplement, setShowAddSupplement] = useState(false);
    const [query, setQuery] = useState('');
    const [library, setLibrary] = useState<SupplementSearchResult[]>([]);
    const [profileText, setProfileText] = useState('');
    const { supplements, add } = useSupplements();
    const analytics = useMemo(
        () => computeSupplementAnalytics(supplements, entries),
        [supplements, entries],
    );
    const allergyProfile = useMemo(
        () => ({
            ...defaultAllergyProfile(),
            allergens: profileText
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            blockedIngredients: profileText
                .toLowerCase()
                .includes('avoid caffeine')
                ? ['caffeine']
                : [],
            dietaryFlags: {
                vegan: profileText.toLowerCase().includes('vegan'),
            },
        }),
        [profileText],
    );
    const warnings = analytics.definitions.flatMap((definition) =>
        detectSupplementWarnings(definition, allergyProfile),
    );

    useEffect(() => {
        const handle = window.setTimeout(() => {
            void searchSupplementLibrary(query, analytics.definitions).then(
                setLibrary,
            );
        }, 200);
        return () => window.clearTimeout(handle);
    }, [query, analytics.definitions]);

    return (
        <div className="space-y-4">
            <TrackingHero
                eyebrow="Supplements dashboard"
                title={
                    analytics.definitions.length > 0
                        ? `${analytics.definitions.length} supplement stack`
                        : 'Build your supplement stack'
                }
                subtitle="Track schedule, adherence, safety, inventory, side effects, and effectiveness."
                tone="purple"
                actions={
                    <>
                        <QuickActionButton
                            tone="purple"
                            primary
                            onClick={() => setShowLogger((v) => !v)}
                        >
                            <Plus className="h-3.5 w-3.5" /> Log dose
                        </QuickActionButton>
                        <QuickActionButton
                            tone="purple"
                            onClick={() => setShowAddSupplement((v) => !v)}
                        >
                            <Plus className="h-3.5 w-3.5" /> Add supplement
                        </QuickActionButton>
                    </>
                }
                kpis={
                    <>
                        <TrackingKpi
                            label="Today adherence"
                            value={`${Math.round(analytics.todayAdherence * 100)}%`}
                            sub={`${analytics.takenToday}/${analytics.dueToday.length} taken`}
                        />
                        <TrackingKpi
                            label="7-day adherence"
                            value={`${Math.round(analytics.adherence7d * 100)}%`}
                        />
                        <TrackingKpi
                            label="30-day adherence"
                            value={`${Math.round(analytics.adherence30d * 100)}%`}
                        />
                        <TrackingKpi
                            label="Overdue"
                            value={String(analytics.overdueCount)}
                            sub={
                                analytics.nextDose
                                    ? `Next ${analytics.nextDose.supplement.name}`
                                    : 'No upcoming'
                            }
                        />
                        <TrackingKpi
                            label="Inventory"
                            value={String(analytics.lowInventory.length)}
                            sub="Low stock"
                        />
                    </>
                }
                progress={{
                    label: 'Today adherence',
                    valueLabel: `${Math.round(analytics.todayAdherence * 100)}%`,
                    ratio: analytics.todayAdherence,
                }}
            />

            {showLogger && (
                <section className={sectionCls}>
                    <QuickEntryForm
                        initialCategory="supplement"
                        lockCategory
                        onSubmit={async (entry) => {
                            await onAdd(entry);
                            setShowLogger(false);
                        }}
                        onCancel={() => setShowLogger(false)}
                    />
                </section>
            )}
            {showAddSupplement && (
                <section className={sectionCls}>
                    <SupplementDefForm
                        onSubmit={async (payload) => {
                            await add(payload);
                            setShowAddSupplement(false);
                        }}
                        onCancel={() => setShowAddSupplement(false)}
                    />
                </section>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Today schedule
                    </h3>
                    <div className="mt-3 space-y-2">
                        {analytics.dueToday.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No schedule for today.
                            </p>
                        )}
                        {analytics.dueToday.map((dose) => (
                            <div
                                key={dose.id}
                                className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3"
                            >
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                            {dose.supplement.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            {dose.time} · {dose.group} ·{' '}
                                            {dose.status}
                                            {dose.overdue ? ' · overdue' : ''}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                                        {dose.supplement.servingSize ??
                                            dose.supplement.doseUnit ??
                                            ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Current stack
                    </h3>
                    <div className="mt-3 space-y-2">
                        {analytics.definitions.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No supplements yet.
                            </p>
                        )}
                        {analytics.definitions.slice(0, 8).map((definition) => (
                            <div
                                key={definition.id}
                                className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3"
                            >
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {definition.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {definition.brand ?? 'Unbranded'} ·{' '}
                                    {scheduleLabel(definition)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Adherence and effectiveness
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                        {analytics.insights.map((insight) => (
                            <p key={insight}>{insight}</p>
                        ))}
                        <p>
                            Adherence/effectiveness correlation:{' '}
                            {analytics.adherenceEffectivenessCorrelation ??
                                'not enough data yet'}
                        </p>
                        <p>
                            Side effect types:{' '}
                            {Object.keys(analytics.sideEffectFrequency)
                                .length || 'none logged'}
                        </p>
                    </div>
                </section>
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Allergies and restrictions
                    </h3>
                    <label
                        htmlFor="supplement-allergy-profile"
                        className="mt-3 block text-xs font-medium text-gray-500 dark:text-zinc-400"
                    >
                        Allergens, sensitivities, and blocked ingredients
                    </label>
                    <textarea
                        id="supplement-allergy-profile"
                        value={profileText}
                        onChange={(e) => setProfileText(e.target.value)}
                        placeholder="peanut, soy, vegan, avoid caffeine"
                        className="mt-1 min-h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <div className="mt-3 space-y-2">
                        {warnings.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                No allergy profile warnings yet.
                            </p>
                        ) : (
                            warnings.map((warning) => (
                                <div
                                    key={warning.id}
                                    className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200"
                                >
                                    <AlertTriangle className="mr-1 inline h-4 w-4" />{' '}
                                    {warning.label}: {warning.detail}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <section className={sectionCls}>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <Boxes className="h-4 w-4" /> Inventory/refills
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                        <p>
                            {analytics.lowInventory.length} low-stock warnings.
                        </p>
                        <p>
                            {analytics.expiringSoon.length} expiration warnings.
                        </p>
                        <p>
                            ${analytics.costPerDay.toFixed(2)}/day · $
                            {analytics.costPerMonth.toFixed(2)}/month where cost
                            is tracked.
                        </p>
                    </div>
                </section>
                <section className={sectionCls}>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        <Search className="h-4 w-4" /> Supplement library/search
                    </h3>
                    <label
                        htmlFor="supplement-library-search"
                        className="mt-3 block text-xs font-medium text-gray-500 dark:text-zinc-400"
                    >
                        Search by text, brand, ingredient, or barcode
                    </label>
                    <input
                        id="supplement-library-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="magnesium, caffeine, 012345..."
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <div className="mt-3 space-y-2">
                        {library.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                <Barcode className="mr-1 inline h-4 w-4" />{' '}
                                Barcode not found or provider unavailable.
                                Manual fallback is available.
                            </p>
                        )}
                        {library.map((item) => (
                            <p
                                key={item.id}
                                className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 dark:bg-zinc-800/70 dark:text-zinc-300"
                            >
                                <Star className="mr-1 inline h-3 w-3" />
                                {item.name} ·{' '}
                                {item.verified ? 'verified' : 'unverified'}
                                {item.duplicateOf
                                    ? ' · duplicate in stack'
                                    : ''}
                            </p>
                        ))}
                    </div>
                </section>
                <section className={sectionCls}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        Goals and safety
                    </h3>
                    <div className="mt-3">
                        <GoalSettingsPanel category="supplement" />
                    </div>
                    <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                        <ShieldAlert className="mr-1 inline h-4 w-4" />{' '}
                        Interaction checks, medication conflicts, upper limits,
                        pregnancy, and condition warnings are reminder-ready
                        placeholders. Verify with a clinician/pharmacist.
                    </div>
                </section>
            </div>

            <section className={sectionCls}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        History, import, and export
                    </h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-zinc-700"
                        >
                            <FileUp className="h-3.5 w-3.5" /> Import CSV
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-zinc-700"
                        >
                            <Download className="h-3.5 w-3.5" /> Export CSV
                        </button>
                    </div>
                </div>
                <div className="mt-3 space-y-2">
                    {analytics.history.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                            No logs yet.
                        </p>
                    )}
                    {analytics.history.slice(0, 20).map((log) => (
                        <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm dark:bg-zinc-800/70"
                        >
                            <span>
                                {log.date} · {log.name} · {log.status}
                            </span>
                            <span className="flex gap-2">
                                {log.rawEntry && (
                                    <button
                                        type="button"
                                        onClick={() => onEdit(log.rawEntry!)}
                                        className="text-xs text-indigo-500"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onDelete(log.id)}
                                    className="text-xs text-red-500"
                                >
                                    Delete
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
