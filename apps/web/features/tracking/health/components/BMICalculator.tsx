'use client';

import { useMemo, useState } from 'react';
import {
    BMI_CATEGORY_BADGE,
    BMI_CATEGORY_COLOR,
    BMI_CATEGORY_LABELS,
    calculateBMI,
    ftInToCm,
    getBMICategory,
    type BMICategory,
    type WeightUnit,
} from '@/features/tracking/health/lib/weightDomain';

export function BMICalculator() {
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
    const tog = (active: boolean) =>
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
                            className={tog(wUnit === 'lbs')}
                            onClick={() => setWUnit('lbs')}
                        >
                            lbs
                        </button>
                        <button
                            type="button"
                            className={tog(wUnit === 'kg')}
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
            <div>
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                        Height
                    </span>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                        <button
                            type="button"
                            className={tog(!hCm)}
                            onClick={() => setHCm('')}
                        >
                            ft/in
                        </button>
                        <button
                            type="button"
                            className={tog(Boolean(hCm))}
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
