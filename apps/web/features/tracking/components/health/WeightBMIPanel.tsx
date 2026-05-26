'use client';

import { useMemo, useState } from 'react';
import { WeightLogForm } from './WeightLogForm';
import {
    BMI_CATEGORY_BADGE,
    BMI_CATEGORY_COLOR,
    BMI_CATEGORY_LABELS,
    calculateBMI,
    computeWeightAnalytics,
    fmtHeight,
    fmtTrend,
    fmtWeight,
    ftInToCm,
    getBMICategory,
    kgToLbs,
    normalizeWeightEntries,
    type BMICategory,
    type WeightEntry,
    type WeightUnit,
} from '@/features/tracking/lib/health/weightDomain';
import { TrackingSection } from '@/features/tracking/components/TrackingSurface';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/tracking';

interface WeightBMIPanelProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onDelete: (id: string) => void;
}

// ─── Tiny SVG trend chart ─────────────────────────────────────────────────────

function WeightTrendChart({
    entries,
    unit,
}: {
    entries: WeightEntry[];
    unit: WeightUnit;
}) {
    const W = 400;
    const H = 100;
    const PAD = { top: 8, right: 12, bottom: 20, left: 36 };

    const points = useMemo(() => {
        const slice = entries.slice(0, 30).reverse(); // oldest → newest
        if (slice.length < 2) return null;
        const weights = slice.map((e) =>
            unit === 'lbs' ? kgToLbs(e.weightKg) : e.weightKg,
        );
        const minW = Math.min(...weights) - 1;
        const maxW = Math.max(...weights) + 1;
        const rangeW = maxW - minW || 1;
        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top - PAD.bottom;
        return slice.map((_, i) => ({
            x: PAD.left + (i / (slice.length - 1)) * innerW,
            y: PAD.top + innerH - ((weights[i]! - minW) / rangeW) * innerH,
            label: weights[i]!.toFixed(1),
            date: slice[i]!.date,
        }));
    }, [entries, unit]);

    if (!points || points.length < 2) {
        return (
            <p className="py-6 text-center text-xs text-gray-400 dark:text-zinc-500">
                Log at least 2 entries to see a trend.
            </p>
        );
    }

    const pathD = points
        .map(
            (p, i) =>
                `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        )
        .join(' ');

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Weight trend chart"
        >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((t) => (
                <line
                    key={t}
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={PAD.top + t * (H - PAD.top - PAD.bottom)}
                    y2={PAD.top + t * (H - PAD.top - PAD.bottom)}
                    stroke="currentColor"
                    strokeOpacity={0.06}
                    strokeWidth={1}
                />
            ))}
            {/* Line */}
            <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Dots — only first and last */}
            {[points[0]!, points[points.length - 1]!].map((p) => (
                <circle key={p.date} cx={p.x} cy={p.y} r={3.5} fill="#6366f1" />
            ))}
            {/* Start/end labels */}
            <text
                x={points[0]!.x}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.45}
            >
                {points[0]!.date.slice(5)}
            </text>
            <text
                x={points[points.length - 1]!.x}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.45}
            >
                {points[points.length - 1]!.date.slice(5)}
            </text>
            {/* Latest value label */}
            <text
                x={points[points.length - 1]!.x + 4}
                y={points[points.length - 1]!.y - 5}
                fontSize={9}
                fill="#6366f1"
                fontWeight="600"
            >
                {points[points.length - 1]!.label}
            </text>
        </svg>
    );
}

// ─── Standalone BMI calculator ────────────────────────────────────────────────

function BMICalculator() {
    const [wUnit, setWUnit] = useState<WeightUnit>('lbs');
    const [weightRaw, setWeightRaw] = useState('');
    const [hFt, setHFt] = useState('');
    const [hIn, setHIn] = useState('');
    const [hCm, setHCm] = useState('');

    const result = useMemo<{
        bmi: number;
        category: BMICategory;
    } | null>(() => {
        const wKg =
            wUnit === 'lbs'
                ? parseFloat(weightRaw) / 2.20462
                : parseFloat(weightRaw);
        const heightCm = hCm
            ? parseFloat(hCm)
            : ftInToCm(parseFloat(hFt) || 0, parseFloat(hIn) || 0);
        if (!wKg || !heightCm || isNaN(wKg) || isNaN(heightCm)) return null;
        if (wKg < 10 || wKg > 500 || heightCm < 50 || heightCm > 250)
            return null;
        const bmi = calculateBMI(wKg, heightCm);
        return { bmi, category: getBMICategory(bmi) };
    }, [weightRaw, wUnit, hFt, hIn, hCm]);

    const inputCls =
        'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
    const toggle = (active: boolean) =>
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`;

    return (
        <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                BMI Calculator
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Calculate your BMI without logging. BMI is a screening tool, not
                a diagnostic measure.
            </p>

            {/* Weight input */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label
                        htmlFor="bmi-calc-w"
                        className="text-xs font-medium text-gray-500 dark:text-zinc-400"
                    >
                        Weight
                    </label>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                        <button
                            type="button"
                            className={toggle(wUnit === 'lbs')}
                            onClick={() => setWUnit('lbs')}
                        >
                            lbs
                        </button>
                        <button
                            type="button"
                            className={toggle(wUnit === 'kg')}
                            onClick={() => setWUnit('kg')}
                        >
                            kg
                        </button>
                    </div>
                </div>
                <input
                    id="bmi-calc-w"
                    type="number"
                    step="0.1"
                    placeholder={wUnit === 'lbs' ? '165' : '75'}
                    value={weightRaw}
                    onChange={(e) => setWeightRaw(e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Height input */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                        Height
                    </span>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                        <button
                            type="button"
                            className={toggle(!hCm)}
                            onClick={() => setHCm('')}
                        >
                            ft/in
                        </button>
                        <button
                            type="button"
                            className={toggle(Boolean(hCm))}
                            onClick={() => {
                                setHFt('');
                                setHIn('');
                            }}
                        >
                            cm
                        </button>
                    </div>
                </div>
                {!hCm ? (
                    <div className="flex gap-2">
                        <input
                            id="bmi-calc-ft"
                            type="number"
                            min="1"
                            max="8"
                            placeholder="5 ft"
                            value={hFt}
                            onChange={(e) => setHFt(e.target.value)}
                            className={inputCls}
                            aria-label="Feet"
                        />
                        <input
                            id="bmi-calc-in"
                            type="number"
                            min="0"
                            max="11"
                            placeholder="10 in"
                            value={hIn}
                            onChange={(e) => setHIn(e.target.value)}
                            className={inputCls}
                            aria-label="Inches"
                        />
                    </div>
                ) : (
                    <input
                        id="bmi-calc-cm"
                        type="number"
                        step="0.1"
                        placeholder="177"
                        value={hCm}
                        onChange={(e) => setHCm(e.target.value)}
                        className={inputCls}
                        aria-label="Height in centimeters"
                    />
                )}
            </div>

            {/* Result */}
            {result ? (
                <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                                BMI
                            </p>
                            <p
                                className={`text-3xl font-extrabold ${BMI_CATEGORY_COLOR[result.category]}`}
                            >
                                {result.bmi.toFixed(1)}
                            </p>
                        </div>
                        <span
                            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${BMI_CATEGORY_BADGE[result.category]}`}
                        >
                            {BMI_CATEGORY_LABELS[result.category]}
                        </span>
                    </div>
                    {/* BMI scale bar */}
                    <div className="mt-3 space-y-1">
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                            <div
                                className="flex-1 bg-sky-300 dark:bg-sky-700"
                                title="Underweight < 18.5"
                            />
                            <div
                                className="flex-[1.65] bg-emerald-400 dark:bg-emerald-600"
                                title="Normal 18.5–25"
                            />
                            <div
                                className="flex-1 bg-amber-400 dark:bg-amber-600"
                                title="Overweight 25–30"
                            />
                            <div
                                className="flex-1 bg-rose-500 dark:bg-rose-700"
                                title="Obese ≥ 30"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 dark:text-zinc-500">
                            <span>Underweight</span>
                            <span>Normal</span>
                            <span>Overweight</span>
                            <span>Obese</span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Ranges: &lt;18.5 · 18.5–24.9 · 25–29.9 · ≥30
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 p-4 text-center text-xs text-gray-400 dark:text-zinc-500">
                    Enter weight and height to calculate BMI
                </div>
            )}
        </div>
    );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

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

    async function handleAdd(entry: BaseTrackingEntry) {
        await onAdd(entry);
        setLogSuccess(true);
        setTimeout(() => setLogSuccess(false), 2500);
    }

    const toggle = (active: boolean) =>
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`;

    return (
        <div className="space-y-4">
            {/* Hero summary */}
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
                        className={`mt-1 text-lg font-bold ${bmiCategory ? BMI_CATEGORY_COLOR[bmiCategory] : 'text-gray-900 dark:text-zinc-100'}`}
                    >
                        {currentBMI !== null ? currentBMI.toFixed(1) : '—'}
                    </p>
                    {bmiCategory && (
                        <span
                            className={`text-[10px] font-semibold ${BMI_CATEGORY_COLOR[bmiCategory]}`}
                        >
                            {BMI_CATEGORY_LABELS[bmiCategory]}
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

            {/* Trend chart */}
            {weightEntries.length >= 2 && (
                <TrackingSection>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                            Weight trend
                        </p>
                        <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                            <button
                                type="button"
                                className={toggle(unit === 'lbs')}
                                onClick={() => setUnit('lbs')}
                            >
                                lbs
                            </button>
                            <button
                                type="button"
                                className={toggle(unit === 'kg')}
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

            {/* Tab nav */}
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

function WeightHistoryRow({
    entry,
    unit,
    onDelete,
}: {
    entry: WeightEntry;
    unit: WeightUnit;
    onDelete: () => void;
}) {
    const bmiCategory = entry.bmi != null ? getBMICategory(entry.bmi) : null;
    return (
        <div className="group flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5">
            <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {fmtWeight(entry.weightKg, unit)}
                    </span>
                    {entry.bmi != null && bmiCategory && (
                        <span
                            className={`text-xs ${BMI_CATEGORY_COLOR[bmiCategory]}`}
                        >
                            BMI {entry.bmi.toFixed(1)}
                        </span>
                    )}
                    {entry.bodyFatPercent != null && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            {entry.bodyFatPercent.toFixed(1)}% fat
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {entry.date}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                </p>
            </div>
            <button
                type="button"
                onClick={onDelete}
                className="ml-3 shrink-0 text-[11px] text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                aria-label={`Delete weight entry for ${entry.date}`}
            >
                Delete
            </button>
        </div>
    );
}
