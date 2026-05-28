'use client';

import { useState, useEffect } from 'react';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';

const CALORIE_PRESETS = [1500, 1800, 2000, 2200, 2500] as const;
const PROTEIN_PRESETS = [80, 100, 120, 150, 180] as const;

interface MealGoalPanelProps {
    onClose?: () => void;
}

export function MealGoalPanel({ onClose }: MealGoalPanelProps) {
    const { allGoals, upsert, remove, loading } = useTrackingGoals('meal');

    const calorieGoal = allGoals.find(
        (g) => g.category === 'meal' && g.metricKey === 'calories',
    );
    const proteinGoal = allGoals.find(
        (g) => g.category === 'meal' && g.metricKey === 'protein',
    );

    const [calorieTarget, setCalorieTarget] = useState(2000);
    const [proteinMin, setProteinMin] = useState(120);
    const [enableCalories, setEnableCalories] = useState(false);
    const [enableProtein, setEnableProtein] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmRemoveCalorie, setConfirmRemoveCalorie] = useState(false);
    const [confirmRemoveProtein, setConfirmRemoveProtein] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [calorieError, setCalorieError] = useState('');
    const [proteinError, setProteinError] = useState('');

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (calorieGoal) {
                setCalorieTarget(calorieGoal.targetValue);
                setEnableCalories(true);
            }
            if (proteinGoal) {
                setProteinMin(proteinGoal.targetValue);
                setEnableProtein(true);
            }
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [calorieGoal, proteinGoal]);

    const validate = (): boolean => {
        let ok = true;
        if (enableCalories) {
            if (!Number.isFinite(calorieTarget) || calorieTarget <= 0) {
                setCalorieError('Calorie target must be a positive number.');
                ok = false;
            } else {
                setCalorieError('');
            }
        }
        if (enableProtein) {
            if (!Number.isFinite(proteinMin) || proteinMin < 0) {
                setProteinError('Protein target cannot be negative.');
                ok = false;
            } else {
                setProteinError('');
            }
        }
        return ok;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (enableCalories) {
                await upsert({
                    targetType: 'daily_min',
                    metricKey: 'calories',
                    targetValue: calorieTarget,
                });
            }
            if (enableProtein) {
                await upsert({
                    targetType: 'daily_min',
                    metricKey: 'protein',
                    targetValue: proteinMin,
                });
            }
            onClose?.();
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (metricKey: 'calories' | 'protein') => {
        setRemoving(true);
        try {
            await remove();
            if (metricKey === 'calories') {
                setEnableCalories(false);
                setConfirmRemoveCalorie(false);
            } else {
                setEnableProtein(false);
                setConfirmRemoveProtein(false);
            }
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-32 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-5">
            <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Nutrition goals
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Set daily targets to track your progress in the meals widget
                    and tracking page.
                </p>
            </div>

            {/* ─── Calorie target ─── */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor="meal-goal-enable-calories"
                        className="text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        Daily calorie target
                    </label>
                    <button
                        id="meal-goal-enable-calories"
                        type="button"
                        role="switch"
                        aria-checked={enableCalories}
                        onClick={() => setEnableCalories((v) => !v)}
                        className={`relative w-8 h-4.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-green-400 ${
                            enableCalories
                                ? 'bg-green-500'
                                : 'bg-gray-200 dark:bg-zinc-700'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                                enableCalories ? 'translate-x-3.5' : ''
                            }`}
                        />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    A daily total — the amount of calories you aim to consume
                    per day.
                </p>
                {enableCalories && (
                    <div className="space-y-2">
                        <div className="flex gap-1.5 flex-wrap">
                            {CALORIE_PRESETS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCalorieTarget(c)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                        calorieTarget === c
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-green-400 hover:text-green-600'
                                    }`}
                                >
                                    {c.toLocaleString()}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="meal-goal-calories"
                                className="text-xs text-gray-500 dark:text-zinc-400 shrink-0"
                            >
                                Custom:
                            </label>
                            <input
                                id="meal-goal-calories"
                                type="number"
                                min={100}
                                max={10000}
                                step={50}
                                value={calorieTarget}
                                onChange={(e) => {
                                    setCalorieTarget(Number(e.target.value));
                                    setCalorieError('');
                                }}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-green-400"
                            />
                            <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">
                                kcal
                            </span>
                        </div>
                        {calorieError && (
                            <p
                                className="text-[11px] text-red-500"
                                role="alert"
                            >
                                {calorieError}
                            </p>
                        )}
                        {calorieGoal && !confirmRemoveCalorie && (
                            <button
                                type="button"
                                onClick={() => setConfirmRemoveCalorie(true)}
                                className="text-[11px] text-gray-400 dark:text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                Remove calorie goal
                            </button>
                        )}
                        {confirmRemoveCalorie && (
                            <div className="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmRemoveCalorie(false)
                                    }
                                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        void handleRemove('calories')
                                    }
                                    disabled={removing}
                                    className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                >
                                    {removing ? 'Removing…' : 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Protein minimum ─── */}
            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mt-2">
                    <label
                        htmlFor="meal-goal-enable-protein"
                        className="text-xs font-semibold text-gray-700 dark:text-zinc-300"
                    >
                        Daily protein target
                    </label>
                    <button
                        id="meal-goal-enable-protein"
                        type="button"
                        role="switch"
                        aria-checked={enableProtein}
                        onClick={() => setEnableProtein((v) => !v)}
                        className={`relative w-8 h-4.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-green-400 ${
                            enableProtein
                                ? 'bg-green-500'
                                : 'bg-gray-200 dark:bg-zinc-700'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                                enableProtein ? 'translate-x-3.5' : ''
                            }`}
                        />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                    A daily minimum — the least amount of protein you aim to eat
                    per day.
                </p>
                {enableProtein && (
                    <div className="space-y-2">
                        <div className="flex gap-1.5 flex-wrap">
                            {PROTEIN_PRESETS.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setProteinMin(p)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                        proteinMin === p
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-green-400 hover:text-green-600'
                                    }`}
                                >
                                    {p}g
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="meal-goal-protein"
                                className="text-xs text-gray-500 dark:text-zinc-400 shrink-0"
                            >
                                Custom:
                            </label>
                            <input
                                id="meal-goal-protein"
                                type="number"
                                min={0}
                                max={500}
                                step={5}
                                value={proteinMin}
                                onChange={(e) => {
                                    setProteinMin(Number(e.target.value));
                                    setProteinError('');
                                }}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-green-400"
                            />
                            <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">
                                g
                            </span>
                        </div>
                        {proteinError && (
                            <p
                                className="text-[11px] text-red-500"
                                role="alert"
                            >
                                {proteinError}
                            </p>
                        )}
                        {proteinGoal && !confirmRemoveProtein && (
                            <button
                                type="button"
                                onClick={() => setConfirmRemoveProtein(true)}
                                className="text-[11px] text-gray-400 dark:text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                Remove protein goal
                            </button>
                        )}
                        {confirmRemoveProtein && (
                            <div className="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConfirmRemoveProtein(false)
                                    }
                                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleRemove('protein')}
                                    disabled={removing}
                                    className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                >
                                    {removing ? 'Removing…' : 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TODO: Add fiber target, calorie range mode, and macro ratio goals when macro tracking is fully supported */}

            {(enableCalories || enableProtein) && (
                <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="w-full text-xs py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving…'
                        : calorieGoal || proteinGoal
                          ? 'Update goals'
                          : 'Set goals'}
                </button>
            )}
        </div>
    );
}
