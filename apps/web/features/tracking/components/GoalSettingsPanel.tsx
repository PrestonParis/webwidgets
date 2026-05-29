'use client';

import { useState, useEffect } from 'react';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { getCategoryLabel } from '@/features/tracking/constants';
import type { GoalTargetType } from '@/features/tracking/types/goals';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import { describeFitnessGoal } from '@/features/tracking/lib/fitness/goals';
import type { FitnessGoalType } from '@/features/tracking/types/fitnessGoals';

const GOAL_PRESETS: Record<
    string,
    {
        targetType: GoalTargetType;
        metricKey?: string;
        targetValue: number;
        label: string;
    }
> = {
    sleep: {
        targetType: 'daily_min',
        metricKey: 'durationHours',
        targetValue: 8,
        label: 'hours/night',
    },
    workout: {
        targetType: 'weekly_count',
        targetValue: 3,
        label: 'sessions/week',
    },
    meal: { targetType: 'weekly_count', targetValue: 14, label: 'meals/week' },
    mood: { targetType: 'daily_log', targetValue: 1, label: 'log daily' },
    supplement: { targetType: 'daily_log', targetValue: 1, label: 'log daily' },
};

const FITNESS_GOAL_TYPES: ReadonlySet<string> = new Set([
    'workouts_per_week',
    'strength_volume',
    'exercise_strength',
    'cardio_distance',
    'cardio_duration',
    'calories_burned',
    'mobility_minutes',
    'active_days',
    'muscle_frequency',
]);

function readFitnessGoalType(metricKey: string | undefined): FitnessGoalType {
    if (metricKey && FITNESS_GOAL_TYPES.has(metricKey)) {
        return metricKey as FitnessGoalType;
    }
    return 'workouts_per_week';
}

interface GoalSettingsPanelProps {
    category: string;
    customDefs?: CustomCategoryDef[];
}

export function GoalSettingsPanel({
    category,
    customDefs = [],
}: GoalSettingsPanelProps) {
    const { goal, upsert, remove, loading } = useTrackingGoals(category);
    const preset = GOAL_PRESETS[category];
    const [targetType, setTargetType] = useState<GoalTargetType>(
        preset?.targetType ?? 'daily_log',
    );
    const [metricKey, setMetricKey] = useState(preset?.metricKey ?? '');
    const [targetValue, setTargetValue] = useState(preset?.targetValue ?? 1);
    const [fitnessType, setFitnessType] =
        useState<FitnessGoalType>('workouts_per_week');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (goal) {
                setTargetType(goal.targetType);
                setMetricKey(goal.metricKey ?? '');
                setTargetValue(goal.targetValue);
                if (category === 'workout')
                    setFitnessType(readFitnessGoalType(goal.metricKey));
            } else if (preset) {
                setTargetType(preset.targetType);
                setMetricKey(preset.metricKey ?? '');
                setTargetValue(preset.targetValue);
            }
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [category, goal, preset]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: {
                targetType: GoalTargetType;
                targetValue: number;
                metricKey?: string;
            } = { targetType, targetValue };
            if (metricKey) payload.metricKey = metricKey;
            await upsert(payload);
        } finally {
            setSaving(false);
        }
    };

    const label = getCategoryLabel(category, customDefs);

    const handleFitnessSave = async () => {
        if (targetValue <= 0) return;
        setSaving(true);
        try {
            const metricKey =
                fitnessType === 'workouts_per_week' ? undefined : fitnessType;
            await upsert({
                targetType:
                    fitnessType === 'workouts_per_week'
                        ? 'weekly_count'
                        : 'daily_min',
                targetValue,
                ...(metricKey !== undefined && { metricKey }),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="h-20 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        );

    if (category === 'workout' && !showAdvanced) {
        const preview = describeFitnessGoal({
            type: fitnessType,
            targetValue,
            unit:
                fitnessType === 'strength_volume'
                    ? 'lb'
                    : fitnessType === 'cardio_distance'
                      ? 'miles'
                      : fitnessType === 'calories_burned'
                        ? 'calories'
                        : fitnessType === 'active_days'
                          ? 'days'
                          : fitnessType === 'workouts_per_week'
                            ? 'workouts'
                            : 'minutes',
            period: 'week',
        });
        return (
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        Fitness goal
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(true)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                    >
                        Advanced
                    </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    {[
                        ['workouts_per_week', 'Workouts/week'],
                        ['strength_volume', 'Strength volume'],
                        ['cardio_distance', 'Cardio distance'],
                        ['cardio_duration', 'Cardio minutes'],
                        ['mobility_minutes', 'Mobility minutes'],
                        ['calories_burned', 'Calories burned'],
                        ['active_days', 'Active days'],
                    ].map(([id, title]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() =>
                                setFitnessType(id as FitnessGoalType)
                            }
                            className={`rounded-lg border px-3 py-2 text-left text-xs ${fitnessType === id ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-200' : 'border-gray-200 text-gray-600 dark:border-zinc-700 dark:text-zinc-300'}`}
                        >
                            {title}
                        </button>
                    ))}
                </div>

                <div>
                    <label
                        htmlFor="fitness-goal-target"
                        className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1"
                    >
                        Target
                    </label>
                    <input
                        id="fitness-goal-target"
                        type="number"
                        min={1}
                        step={fitnessType === 'cardio_distance' ? 0.1 : 1}
                        value={targetValue}
                        onChange={(e) =>
                            setTargetValue(Math.max(1, Number(e.target.value)))
                        }
                        className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                        {preview}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void handleFitnessSave()}
                    disabled={saving || targetValue <= 0}
                    className="w-full text-xs py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving…'
                        : goal
                          ? 'Update fitness goal'
                          : 'Set fitness goal'}
                </button>

                {goal && (
                    <details className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2">
                        <summary className="cursor-pointer text-xs text-gray-500 dark:text-zinc-400">
                            Remove goal
                        </summary>
                        <button
                            type="button"
                            onClick={() => void remove()}
                            className="mt-2 text-xs text-red-500 hover:text-red-600"
                        >
                            Confirm removal
                        </button>
                    </details>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    {label} goal
                </p>
                {goal && (
                    <button
                        onClick={() => void remove()}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                        Remove goal
                    </button>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">
                        Goal type
                    </label>
                    <select
                        value={targetType}
                        onChange={(e) =>
                            setTargetType(e.target.value as GoalTargetType)
                        }
                        className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                    >
                        <option value="daily_log">
                            Log daily (any entry counts)
                        </option>
                        <option value="daily_min">Daily minimum value</option>
                        <option value="weekly_count">
                            Weekly session count
                        </option>
                    </select>
                </div>

                {targetType === 'daily_min' && (
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">
                            Metric field (e.g. durationHours, quality)
                        </label>
                        <input
                            type="text"
                            value={metricKey}
                            onChange={(e) => setMetricKey(e.target.value)}
                            placeholder="durationHours"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                )}

                {targetType !== 'daily_log' && (
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">
                            {targetType === 'daily_min'
                                ? 'Minimum value'
                                : 'Sessions per week'}
                        </label>
                        <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={targetValue}
                            onChange={(e) =>
                                setTargetValue(Number(e.target.value))
                            }
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                        {preset?.label && (
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                                Suggested: {preset.label}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-full text-xs py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
                {saving ? 'Saving…' : goal ? 'Update goal' : 'Set goal'}
            </button>
        </div>
    );
}
