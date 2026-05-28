'use client';

import { useMemo, useState } from 'react';
import { WeightLogForm } from './WeightLogForm';
import { WeightTrendChart } from './WeightTrendChart';
import { WeightHistoryRow } from './WeightHistoryRow';
import { BMICalculator } from './BMICalculator';
import {
    BMI_CATEGORY_COLOR,
    BMI_CATEGORY_LABELS,
    computeWeightAnalytics,
    fmtHeight,
    fmtTrend,
    fmtWeight,
    normalizeWeightEntries,
    type BMICategory,
    type WeightUnit,
} from '@/features/tracking/health/lib/weightDomain';
import { TrackingSection } from '@/features/tracking/components/TrackingSurface';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/trackingEntries';

interface WeightBMIPanelProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onDelete: (id: string) => void;
}

type PanelTab = 'log' | 'history' | 'calculator';
const TABS: { id: PanelTab; label: string }[] = [
    { id: 'log', label: 'Log Weight' },
    { id: 'history', label: 'History' },
    { id: 'calculator', label: 'BMI Calculator' },
];

export function WeightBMIPanel({
    entries,
    onAdd,
    onDelete,
}: WeightBMIPanelProps) {
    const [tab, setTab] = useState<PanelTab>('log');
    const [unit, setUnit] = useState<WeightUnit>('lbs');
    const [logSuccess, setLogSuccess] = useState(false);

    const weightEntries = useMemo(
        () => normalizeWeightEntries(entries),
        [entries],
    );
    const analytics = useMemo(
        () => computeWeightAnalytics(weightEntries),
        [weightEntries],
    );
    const { latest, currentBMI, bmiCategory, changeKg, trend7dKg } = analytics;
    const lastHeightCm = useMemo(
        () => weightEntries.find((e) => e.heightCm != null)?.heightCm,
        [weightEntries],
    );

    const tog = (active: boolean) =>
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`;

    async function handleAdd(entry: BaseTrackingEntry) {
        await onAdd(entry);
        setLogSuccess(true);
        setTimeout(() => setLogSuccess(false), 2500);
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                        Current
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-zinc-100">
                        {latest ? fmtWeight(latest.weightKg, unit) : '—'}
                    </p>
                    {changeKg !== null && (
                        <p
                            className={`text-xs font-medium ${changeKg < 0 ? 'text-emerald-600 dark:text-emerald-400' : changeKg > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400'}`}
                        >
                            {changeKg > 0 ? '+' : ''}
                            {fmtWeight(Math.abs(changeKg), unit)
                                .replace(' lbs', '')
                                .replace(' kg', '')}
                            {unit === 'lbs' ? ' lbs' : ' kg'} vs last
                        </p>
                    )}
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                        BMI
                    </p>
                    <p
                        className={`mt-1 text-lg font-bold ${bmiCategory ? BMI_CATEGORY_COLOR[bmiCategory as BMICategory] : 'text-gray-900 dark:text-zinc-100'}`}
                    >
                        {currentBMI !== null ? currentBMI.toFixed(1) : '—'}
                    </p>
                    {bmiCategory && (
                        <span
                            className={`text-[10px] font-semibold ${BMI_CATEGORY_COLOR[bmiCategory as BMICategory]}`}
                        >
                            {BMI_CATEGORY_LABELS[bmiCategory as BMICategory]}
                        </span>
                    )}
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                        7-day trend
                    </p>
                    <p
                        className={`mt-1 text-lg font-bold ${trend7dKg !== null && trend7dKg < 0 ? 'text-emerald-600 dark:text-emerald-400' : trend7dKg !== null && trend7dKg > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-gray-900 dark:text-zinc-100'}`}
                    >
                        {fmtTrend(trend7dKg, unit)}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        per week
                    </p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/70 p-3">
                    <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                        Logs
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-zinc-100">
                        {weightEntries.length}
                    </p>
                    {latest?.heightCm && (
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Height:{' '}
                            {fmtHeight(
                                latest.heightCm,
                                unit === 'lbs' ? 'in' : 'cm',
                            )}
                        </p>
                    )}
                </div>
            </div>

            {weightEntries.length >= 2 && (
                <TrackingSection>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                            Weight trend
                        </p>
                        <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                            <button
                                type="button"
                                className={tog(unit === 'lbs')}
                                onClick={() => setUnit('lbs')}
                            >
                                lbs
                            </button>
                            <button
                                type="button"
                                className={tog(unit === 'kg')}
                                onClick={() => setUnit('kg')}
                            >
                                kg
                            </button>
                        </div>
                    </div>
                    <div className="text-gray-900 dark:text-zinc-100">
                        <WeightTrendChart entries={weightEntries} unit={unit} />
                    </div>
                </TrackingSection>
            )}

            <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'log' && (
                <TrackingSection>
                    {logSuccess && (
                        <div className="mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            ✓ Weight logged successfully.
                        </div>
                    )}
                    <WeightLogForm
                        onSubmit={handleAdd}
                        lastHeightCm={lastHeightCm}
                        defaultUnit={unit}
                    />
                </TrackingSection>
            )}
            {tab === 'history' && (
                <TrackingSection>
                    {weightEntries.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                            No weight entries yet. Log your first measurement
                            above.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {weightEntries.map((entry) => (
                                <WeightHistoryRow
                                    key={entry.id}
                                    entry={entry}
                                    unit={unit}
                                    onDelete={() => onDelete(entry.id)}
                                />
                            ))}
                        </div>
                    )}
                </TrackingSection>
            )}
            {tab === 'calculator' && (
                <TrackingSection>
                    <BMICalculator />
                </TrackingSection>
            )}
        </div>
    );
}
