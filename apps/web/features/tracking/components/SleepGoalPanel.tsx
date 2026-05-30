'use client';

import { useState, useEffect } from 'react';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';

const HOUR_PRESETS = [7, 7.5, 8, 8.5, 9] as const;

interface SleepGoalPanelProps {
    onClose?: () => void;
}

export function SleepGoalPanel({ onClose }: SleepGoalPanelProps) {
    const { goal, upsert, remove, loading } = useTrackingGoals('sleep');
    const [targetHours, setTargetHours] = useState(8);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (goal?.targetType === 'daily_min') {
                setTargetHours(goal.targetValue);
            }
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [goal]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await upsert({
                targetType: 'daily_min',
                metricKey: 'durationHours',
                targetValue: targetHours,
            });
            onClose?.();
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        try {
            await remove();
            setConfirmRemove(false);
            onClose?.();
        } finally {
            setRemoving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-24 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-4">
            <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Sleep goal
                </p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Most adults aim for 7–9 hours per night.
                </p>
            </div>

            <div>
                <label
                    htmlFor="sleep-goal-hours"
                    className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-2"
                >
                    Sleep at least:{' '}
                    <span className="text-indigo-500 font-semibold">
                        {targetHours}h
                    </span>{' '}
                    per night
                </label>

                {/* Quick presets */}
                <div className="flex gap-1.5 mb-2 flex-wrap">
                    {HOUR_PRESETS.map((h) => (
                        <button
                            key={h}
                            type="button"
                            onClick={() => setTargetHours(h)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                targetHours === h
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-indigo-400 hover:text-indigo-500'
                            }`}
                        >
                            {h}h
                        </button>
                    ))}
                </div>

                <input
                    id="sleep-goal-hours"
                    type="range"
                    min={4}
                    max={12}
                    step={0.5}
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    <span>4h</span>
                    <span>12h</span>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                This goal is measured against your logged sleep duration each
                night.
            </p>

            <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-full text-xs py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
                {saving
                    ? 'Saving…'
                    : goal
                      ? `Update to ${targetHours}h`
                      : `Set ${targetHours}h goal`}
            </button>

            {goal && !confirmRemove && (
                <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="w-full text-[11px] text-gray-400 dark:text-zinc-500 hover:text-red-400 transition-colors py-1"
                >
                    Remove goal
                </button>
            )}

            {confirmRemove && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmRemove(false)}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleRemove()}
                        disabled={removing}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50 transition-colors"
                    >
                        {removing ? 'Removing…' : 'Remove goal'}
                    </button>
                </div>
            )}
        </div>
    );
}
