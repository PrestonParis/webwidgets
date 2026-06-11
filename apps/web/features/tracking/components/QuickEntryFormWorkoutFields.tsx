'use client';

import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';
import type { ExerciseEntry } from '@/features/tracking/types/fitness';
import { calculateWorkoutTotals } from '@/features/tracking/lib/fitness/normalize';
import {
    inputCls,
    labelCls,
    btnCls,
    makeExercise,
} from '@/features/tracking/lib/quickEntry/workoutFieldsUtils';
import { WorkoutExerciseRow } from './QuickEntryFormWorkoutExerciseRow';

interface WorkoutFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

export function WorkoutFields({ form, updateField }: WorkoutFieldsProps) {
    const exercises = form.exercises ?? [];
    const totals = calculateWorkoutTotals(exercises);
    const type = form.workoutType ?? 'strength';

    const setExercises = (next: ExerciseEntry[]) =>
        updateField('exercises', next);
    const updateExercise = (index: number, patch: Partial<ExerciseEntry>) => {
        setExercises(
            exercises.map((exercise, i) =>
                i === index ? { ...exercise, ...patch } : exercise,
            ),
        );
    };

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor="workout-name" className={labelCls}>
                    Workout name
                </label>
                <input
                    id="workout-name"
                    value={form.workoutName ?? ''}
                    onChange={(e) =>
                        updateField('workoutName', e.target.value || undefined)
                    }
                    placeholder="Push day, Zone 2 run, Mobility"
                    className={inputCls}
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label htmlFor="workout-type" className={labelCls}>
                        Type
                    </label>
                    <select
                        id="workout-type"
                        value={type}
                        onChange={(e) =>
                            updateField('workoutType', e.target.value)
                        }
                        className={inputCls}
                    >
                        <option value="strength">Strength</option>
                        <option value="cardio">Cardio</option>
                        <option value="mobility">Mobility</option>
                        <option value="sport">Sport</option>
                        <option value="mixed">Mixed</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="workout-duration" className={labelCls}>
                        Duration (min)
                    </label>
                    <input
                        id="workout-duration"
                        type="number"
                        min={1}
                        max={600}
                        value={form.duration ?? ''}
                        onChange={(e) =>
                            updateField(
                                'duration',
                                e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                            )
                        }
                        className={inputCls}
                    />
                </div>
            </div>

            {(type === 'cardio' || type === 'mixed') && (
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label htmlFor="workout-distance" className={labelCls}>
                            Distance
                        </label>
                        <input
                            id="workout-distance"
                            type="number"
                            min={0}
                            step={0.1}
                            value={form.distance ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'distance',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label htmlFor="workout-calories" className={labelCls}>
                            Calories
                        </label>
                        <input
                            id="workout-calories"
                            type="number"
                            min={0}
                            value={form.caloriesBurned ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'caloriesBurned',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label htmlFor="workout-hr" className={labelCls}>
                            Avg HR
                        </label>
                        <input
                            id="workout-hr"
                            type="number"
                            min={30}
                            max={240}
                            value={form.averageHeartRate ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'averageHeartRate',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="workout-rpe" className={labelCls}>
                    RPE / intensity: {form.intensity ?? 5}
                </label>
                <input
                    id="workout-rpe"
                    type="range"
                    min={1}
                    max={10}
                    value={form.intensity ?? 5}
                    onChange={(e) =>
                        updateField('intensity', Number(e.target.value))
                    }
                    className="w-full accent-indigo-500"
                />
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                        Exercises and sets
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            setExercises([...exercises, makeExercise()])
                        }
                        className={btnCls}
                    >
                        Add exercise
                    </button>
                </div>
                {exercises.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        Add exercises for PRs, volume, and progression.
                    </p>
                )}
                {exercises.map((exercise, exerciseIndex) => (
                    <WorkoutExerciseRow
                        key={`${exercise.exerciseId}-${exerciseIndex}`}
                        exercise={exercise}
                        exerciseIndex={exerciseIndex}
                        onUpdate={(patch) =>
                            updateExercise(exerciseIndex, patch)
                        }
                        onRemove={() =>
                            setExercises(
                                exercises.filter((_, i) => i !== exerciseIndex),
                            )
                        }
                    />
                ))}
                <p
                    className="text-[11px] text-gray-500 dark:text-zinc-400"
                    aria-live="polite"
                >
                    Volume {Math.round(totals.totalVolume).toLocaleString()} ·{' '}
                    {totals.totalSets} sets · {totals.totalReps} reps
                </p>
            </div>
        </div>
    );
}
