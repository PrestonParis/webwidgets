'use client';

import { useState, useEffect } from 'react';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { getCategoryLabel } from '@/features/tracking/constants';
import type { GoalTargetType } from '@/features/tracking/types/goals';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (goal) {
            setTargetType(goal.targetType);
            setMetricKey(goal.metricKey ?? '');
            setTargetValue(goal.targetValue);
        } else if (preset) {
            setTargetType(preset.targetType);
            setMetricKey(preset.metricKey ?? '');
            setTargetValue(preset.targetValue);
        }
    }, [goal, preset]);

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

    if (loading)
        return (
            <div className="h-20 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        );

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
