'use client';

import { useState, useEffect } from 'react';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import {
    extractNutritionGoalConfig,
    GOAL_PRESETS,
} from '@/features/tracking/lib/meal/nutrition/goals';
import type { MealGoalMetricKey } from '@/features/tracking/lib/meal/nutrition/goals';
import type { NutritionGoalConfig } from '@/features/tracking/lib/meal/nutrition/goalTypes';

interface NutritionGoalPanelProps {
    onClose?: () => void;
}

/** Editable goal fields with nutrition-friendly labels (no raw metric names). */
interface GoalFieldDef {
    metricKey: MealGoalMetricKey;
    configKey: keyof NutritionGoalConfig;
    label: string;
    helper: string;
    unit: string;
    placeholder: number;
}

const GOAL_FIELDS: GoalFieldDef[] = [
    {
        metricKey: 'calories',
        configKey: 'calorieTarget',
        label: 'Daily calorie target',
        helper: 'The amount of calories you aim to consume each day.',
        unit: 'kcal',
        placeholder: 2000,
    },
    {
        metricKey: 'protein',
        configKey: 'proteinMin',
        label: 'Daily protein minimum',
        helper: 'The least protein you want to eat each day.',
        unit: 'g',
        placeholder: 120,
    },
    {
        metricKey: 'carbs',
        configKey: 'carbsTarget',
        label: 'Daily carbs target',
        helper: 'Your carbohydrate goal for the day.',
        unit: 'g',
        placeholder: 220,
    },
    {
        metricKey: 'fat',
        configKey: 'fatTarget',
        label: 'Daily fat target',
        helper: 'Your fat intake goal for the day.',
        unit: 'g',
        placeholder: 70,
    },
    {
        metricKey: 'fiber',
        configKey: 'fiberMin',
        label: 'Daily fiber minimum',
        helper: 'The least fiber you want to eat each day.',
        unit: 'g',
        placeholder: 30,
    },
    {
        metricKey: 'sodium',
        configKey: 'sodiumMax',
        label: 'Daily sodium maximum',
        helper: 'A daily cap on sodium.',
        unit: 'mg',
        placeholder: 2300,
    },
    {
        metricKey: 'mealsPerDay',
        configKey: 'mealsPerDay',
        label: 'Meals per day',
        helper: 'How many meals you aim to log each day.',
        unit: '',
        placeholder: 3,
    },
];

const inputCls =
    'w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-green-400';

/**
 * Expanded nutrition goal editor: presets + per-field enable toggles for
 * calories, protein, carbs, fat, fiber, sodium, and meals/day. Persists each
 * field as a generic tracking goal (metricKey-based) — no schema change.
 */
export function NutritionGoalPanel({ onClose }: NutritionGoalPanelProps) {
    const { allGoals, upsert, loading } = useTrackingGoals('meal');

    const [enabled, setEnabled] = useState<Record<string, boolean>>({});
    const [values, setValues] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const config = extractNutritionGoalConfig(allGoals);
            const nextEnabled: Record<string, boolean> = {};
            const nextValues: Record<string, number> = {};
            for (const field of GOAL_FIELDS) {
                const current = config[field.configKey];
                if (current !== null && current !== undefined) {
                    nextEnabled[field.metricKey] = true;
                    nextValues[field.metricKey] = current;
                } else {
                    nextValues[field.metricKey] = field.placeholder;
                }
            }
            setEnabled(nextEnabled);
            setValues(nextValues);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [allGoals]);

    const applyPreset = (presetId: string) => {
        const preset = GOAL_PRESETS.find((p) => p.id === presetId);
        if (!preset || presetId === 'custom') return;
        const nextEnabled: Record<string, boolean> = {};
        const nextValues: Record<string, number> = { ...values };
        for (const field of GOAL_FIELDS) {
            const v = preset.config[field.configKey];
            if (typeof v === 'number') {
                nextEnabled[field.metricKey] = true;
                nextValues[field.metricKey] = v;
            }
        }
        setEnabled(nextEnabled);
        setValues(nextValues);
    };

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        for (const field of GOAL_FIELDS) {
            if (!enabled[field.metricKey]) continue;
            const v = values[field.metricKey];
            if (v === undefined || !Number.isFinite(v) || v < 0) {
                next[field.metricKey] = 'Enter a valid non-negative number.';
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            for (const field of GOAL_FIELDS) {
                if (!enabled[field.metricKey]) continue;
                const targetType =
                    field.metricKey === 'mealsPerDay'
                        ? 'daily_log'
                        : field.metricKey === 'sodium'
                          ? 'daily_min' // store as value; "max" semantics applied in progress calc
                          : 'daily_min';
                await upsert({
                    targetType,
                    metricKey: field.metricKey,
                    targetValue: values[field.metricKey]!,
                });
            }
            onClose?.();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-40 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-5">
            <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Nutrition goals
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Pick a preset or set your own daily targets. Progress shows
                    in the Meals widget and tracking page.
                </p>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 flex-wrap">
                {GOAL_PRESETS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        title={p.description}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-green-400 hover:text-green-600 transition-colors"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Fields */}
            <div className="space-y-4">
                {GOAL_FIELDS.map((field) => (
                    <div key={field.metricKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor={`goal-enable-${field.metricKey}`}
                                className="text-xs font-semibold text-gray-700 dark:text-zinc-300"
                            >
                                {field.label}
                            </label>
                            <button
                                id={`goal-enable-${field.metricKey}`}
                                type="button"
                                role="switch"
                                aria-checked={!!enabled[field.metricKey]}
                                onClick={() =>
                                    setEnabled((prev) => ({
                                        ...prev,
                                        [field.metricKey]:
                                            !prev[field.metricKey],
                                    }))
                                }
                                className={`relative w-8 h-4.5 rounded-full transition-colors ${
                                    enabled[field.metricKey]
                                        ? 'bg-green-500'
                                        : 'bg-gray-200 dark:bg-zinc-700'
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                                        enabled[field.metricKey]
                                            ? 'translate-x-3.5'
                                            : ''
                                    }`}
                                />
                            </button>
                        </div>
                        {enabled[field.metricKey] && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        id={`goal-value-${field.metricKey}`}
                                        type="number"
                                        min={0}
                                        value={values[field.metricKey] ?? ''}
                                        onChange={(e) => {
                                            setValues((prev) => ({
                                                ...prev,
                                                [field.metricKey]: Number(
                                                    e.target.value,
                                                ),
                                            }));
                                            setErrors((prev) => ({
                                                ...prev,
                                                [field.metricKey]: '',
                                            }));
                                        }}
                                        aria-label={field.label}
                                        className={inputCls}
                                    />
                                    {field.unit && (
                                        <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">
                                            {field.unit}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    {field.helper}
                                </p>
                                {errors[field.metricKey] && (
                                    <p
                                        className="text-[11px] text-red-500"
                                        role="alert"
                                    >
                                        {errors[field.metricKey]}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 text-xs py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="flex-1 text-xs py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving ? 'Saving…' : 'Save goals'}
                </button>
            </div>
        </div>
    );
}
