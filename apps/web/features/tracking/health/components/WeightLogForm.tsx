'use client';

import { useState } from 'react';
import {
    BMI_CATEGORY_BADGE,
    BMI_CATEGORY_LABELS,
    calculateBMI,
    getBMICategory,
    kgToLbs,
    lbsToKg,
    type HeightUnit,
    type WeightUnit,
} from '@/features/tracking/health/lib/weightDomain';
import { WeightHeightInput, ftInToCm } from './WeightHeightInput';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

interface WeightLogFormProps {
    onSubmit: (entry: BaseTrackingEntry) => Promise<void>;
    onCancel?: () => void;
    /** Pre-filled from most recent weight entry */
    lastHeightCm?: number;
    defaultUnit?: WeightUnit;
    initialDate?: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function WeightLogForm({
    onSubmit,
    onCancel,
    lastHeightCm,
    defaultUnit = 'lbs',
    initialDate = TODAY,
}: WeightLogFormProps) {
    const [weightUnit, setWeightUnit] = useState<WeightUnit>(defaultUnit);
    const [heightUnit, setHeightUnit] = useState<HeightUnit>('in');
    const [weightRaw, setWeightRaw] = useState('');
    const [heightFt, setHeightFt] = useState(
        lastHeightCm ? String(Math.floor(lastHeightCm / 2.54 / 12)) : '',
    );
    const [heightInches, setHeightInches] = useState(
        lastHeightCm ? String(Math.round((lastHeightCm / 2.54) % 12)) : '',
    );
    const [heightCmRaw, setHeightCmRaw] = useState(
        lastHeightCm ? String(Math.round(lastHeightCm)) : '',
    );
    const [bodyFat, setBodyFat] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(initialDate);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Derived: resolved values in metric
    const weightKg = (() => {
        const n = parseFloat(weightRaw);
        if (isNaN(n) || n <= 0) return null;
        return weightUnit === 'lbs' ? lbsToKg(n) : n;
    })();

    const heightCm = (() => {
        if (heightUnit === 'in') {
            const ft = parseFloat(heightFt);
            const inc = parseFloat(heightInches);
            if (isNaN(ft) && isNaN(inc)) return lastHeightCm ?? null;
            return ftInToCm(!isNaN(ft) ? ft : 0, !isNaN(inc) ? inc : 0);
        }
        const n = parseFloat(heightCmRaw);
        if (isNaN(n) || n <= 0) return lastHeightCm ?? null;
        return n;
    })();

    const bmi =
        weightKg !== null && heightCm !== null && heightCm > 0
            ? calculateBMI(weightKg, heightCm)
            : null;
    const bmiCategory = bmi !== null ? getBMICategory(bmi) : null;

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (weightKg === null || weightKg <= 0)
            e['weight'] = 'Enter a valid weight.';
        if (weightKg !== null && (weightKg < 20 || weightKg > 500))
            e['weight'] =
                'Weight seems out of range (20–500 kg / 44–1100 lbs).';
        if (bodyFat) {
            const bf = parseFloat(bodyFat);
            if (isNaN(bf) || bf < 0 || bf > 70)
                e['bodyFat'] = 'Body fat % must be between 0 and 70.';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate() || weightKg === null) return;
        setSaving(true);
        try {
            const bf = bodyFat ? parseFloat(bodyFat) : undefined;
            const entry: BaseTrackingEntry = {
                category: 'health',
                entryDate: date,
                source: 'manual',
                tags: ['weight'],
                notes: notes || undefined,
                metadata: {
                    weightEntryType: 'weight',
                    weightKg,
                    ...(heightCm != null && { heightCm }),
                    ...(bmi !== null && { bmi }),
                    ...(bf !== undefined &&
                        !isNaN(bf) && { bodyFatPercent: bf }),
                },
            };
            await onSubmit(entry);
        } finally {
            setSaving(false);
        }
    }

    const inputCls =
        'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
    const labelCls =
        'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';
    const toggleCls = (active: boolean) =>
        `px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${active ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`;

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(e);
            }}
            className="space-y-3 text-sm"
        >
            <div>
                <label htmlFor="wlf-date" className={labelCls}>
                    Date
                </label>
                <input
                    id="wlf-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label
                        htmlFor="wlf-weight"
                        className={labelCls.replace(' mb-1', '')}
                    >
                        Weight
                    </label>
                    <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-800 p-0.5">
                        <button
                            type="button"
                            className={toggleCls(weightUnit === 'lbs')}
                            onClick={() => setWeightUnit('lbs')}
                        >
                            lbs
                        </button>
                        <button
                            type="button"
                            className={toggleCls(weightUnit === 'kg')}
                            onClick={() => setWeightUnit('kg')}
                        >
                            kg
                        </button>
                    </div>
                </div>
                <input
                    id="wlf-weight"
                    type="number"
                    step="0.1"
                    placeholder={weightUnit === 'lbs' ? '165.0' : '75.0'}
                    value={weightRaw}
                    onChange={(e) => setWeightRaw(e.target.value)}
                    className={inputCls}
                    aria-describedby={
                        errors['weight'] ? 'wlf-weight-err' : undefined
                    }
                />
                {errors['weight'] && (
                    <p
                        id="wlf-weight-err"
                        className="mt-0.5 text-xs text-red-500"
                    >
                        {errors['weight']}
                    </p>
                )}
                {weightKg !== null && (
                    <p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">
                        ={' '}
                        {weightUnit === 'lbs'
                            ? `${weightKg.toFixed(2)} kg`
                            : `${kgToLbs(weightKg).toFixed(1)} lbs`}
                    </p>
                )}
            </div>

            {/* Height (for BMI) */}
            <WeightHeightInput
                heightUnit={heightUnit}
                heightFt={heightFt}
                heightInches={heightInches}
                heightCmRaw={heightCmRaw}
                onUnitChange={setHeightUnit}
                onFtChange={setHeightFt}
                onInChange={setHeightInches}
                onCmChange={setHeightCmRaw}
                inputCls={inputCls}
                toggleCls={toggleCls}
            />

            {bmi !== null && bmiCategory !== null && (
                <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 px-3 py-2">
                    <div>
                        <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                            BMI
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                            {bmi.toFixed(1)}
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BMI_CATEGORY_BADGE[bmiCategory]}`}
                    >
                        {BMI_CATEGORY_LABELS[bmiCategory]}
                    </span>
                </div>
            )}

            {/* Body fat % */}
            <div>
                <label htmlFor="wlf-bf" className={labelCls}>
                    Body fat % <span className="font-normal">(optional)</span>
                </label>
                <input
                    id="wlf-bf"
                    type="number"
                    step="0.1"
                    min="1"
                    max="70"
                    placeholder="18.5"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    className={inputCls}
                    aria-describedby={
                        errors['bodyFat'] ? 'wlf-bf-err' : undefined
                    }
                />
                {errors['bodyFat'] && (
                    <p id="wlf-bf-err" className="mt-0.5 text-xs text-red-500">
                        {errors['bodyFat']}
                    </p>
                )}
            </div>

            {/* Notes */}
            <div>
                <label htmlFor="wlf-notes" className={labelCls}>
                    Notes <span className="font-normal">(optional)</span>
                </label>
                <input
                    id="wlf-notes"
                    type="text"
                    placeholder="Morning weigh-in, after workout…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={saving || weightKg === null}
                    className="flex-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save weight'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
