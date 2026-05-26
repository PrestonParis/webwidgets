'use client';

import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';
import type {
    ExerciseEntry,
    SetEntry,
    SetType,
} from '@/features/tracking/lib/fitness/types';
import { calculateWorkoutTotals } from '@/features/tracking/lib/fitness/normalize';

interface WorkoutFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';
const btnCls =
    'px-2 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 transition-colors';

const SET_TYPES: SetType[] = [
    'warmup',
    'working',
    'drop',
    'failure',
    'timed',
    'distance',
];

function makeExercise(): ExerciseEntry {
    return {
        exerciseId: `custom-${Date.now()}`,
        name: '',
        category: 'strength',
        muscleGroups: [],
        equipment: [],
        sets: [{ setType: 'working', completed: true, reps: 8, weight: 0 }],
    };
}

function makeSet(previous?: SetEntry): SetEntry {
    return {
        setType: previous?.setType ?? 'working',
        completed: false,
        ...(previous?.reps !== undefined && { reps: previous.reps }),
        ...(previous?.weight !== undefined && { weight: previous.weight }),
        ...(previous?.durationSeconds !== undefined && {
            durationSeconds: previous.durationSeconds,
        }),
        ...(previous?.distance !== undefined && {
            distance: previous.distance,
        }),
        ...(previous?.rpe !== undefined && { rpe: previous.rpe }),
    };
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
    const updateSet = (
        exerciseIndex: number,
        setIndex: number,
        patch: Partial<SetEntry>,
    ) => {
        const next = exercises.map((exercise, i) => {
            if (i !== exerciseIndex) return exercise;
            return {
                ...exercise,
                sets: exercise.sets.map((set, j) =>
                    j === setIndex ? { ...set, ...patch } : set,
                ),
            };
        });
        setExercises(next);
    };
    const numericSetPatch = (
        key: 'reps' | 'weight' | 'durationSeconds' | 'rpe',
        value: string,
    ): Partial<SetEntry> => {
        if (!value) return {};
        return { [key]: Number(value) };
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
                    <div
                        key={`${exercise.exerciseId}-${exerciseIndex}`}
                        className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 p-2 space-y-2"
                    >
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <label
                                className="sr-only"
                                htmlFor={`exercise-name-${exerciseIndex}`}
                            >
                                Exercise name
                            </label>
                            <input
                                id={`exercise-name-${exerciseIndex}`}
                                value={exercise.name}
                                onChange={(e) =>
                                    updateExercise(exerciseIndex, {
                                        name: e.target.value,
                                        exerciseId:
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]+/g, '-') ||
                                            exercise.exerciseId,
                                    })
                                }
                                placeholder="Bench press"
                                className={inputCls}
                            />
                            <button
                                type="button"
                                aria-label="Remove exercise"
                                onClick={() =>
                                    setExercises(
                                        exercises.filter(
                                            (_, i) => i !== exerciseIndex,
                                        ),
                                    )
                                }
                                className={btnCls}
                            >
                                Remove
                            </button>
                        </div>
                        <label
                            className="sr-only"
                            htmlFor={`exercise-muscles-${exerciseIndex}`}
                        >
                            Muscle groups
                        </label>
                        <input
                            id={`exercise-muscles-${exerciseIndex}`}
                            value={exercise.muscleGroups.join(', ')}
                            onChange={(e) =>
                                updateExercise(exerciseIndex, {
                                    muscleGroups: e.target.value
                                        .split(',')
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                })
                            }
                            placeholder="Muscle groups: chest, triceps"
                            className={inputCls}
                        />
                        <div className="space-y-1">
                            {exercise.sets.map((set, setIndex) => (
                                <div
                                    key={setIndex}
                                    className="grid grid-cols-6 gap-1 items-end"
                                >
                                    <label
                                        className="sr-only"
                                        htmlFor={`set-type-${exerciseIndex}-${setIndex}`}
                                    >
                                        Set type
                                    </label>
                                    <select
                                        id={`set-type-${exerciseIndex}-${setIndex}`}
                                        value={set.setType}
                                        onChange={(e) =>
                                            updateSet(exerciseIndex, setIndex, {
                                                setType: e.target
                                                    .value as SetType,
                                            })
                                        }
                                        className={inputCls}
                                    >
                                        {SET_TYPES.map((setType) => (
                                            <option
                                                key={setType}
                                                value={setType}
                                            >
                                                {setType}
                                            </option>
                                        ))}
                                    </select>
                                    <label
                                        className="sr-only"
                                        htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}
                                    >
                                        Reps
                                    </label>
                                    <input
                                        id={`set-reps-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={0}
                                        placeholder="Reps"
                                        value={set.reps ?? ''}
                                        onChange={(e) =>
                                            updateSet(
                                                exerciseIndex,
                                                setIndex,
                                                numericSetPatch(
                                                    'reps',
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={inputCls}
                                    />
                                    <label
                                        className="sr-only"
                                        htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}
                                    >
                                        Weight
                                    </label>
                                    <input
                                        id={`set-weight-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        placeholder="Weight"
                                        value={set.weight ?? ''}
                                        onChange={(e) =>
                                            updateSet(
                                                exerciseIndex,
                                                setIndex,
                                                numericSetPatch(
                                                    'weight',
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={inputCls}
                                    />
                                    <label
                                        className="sr-only"
                                        htmlFor={`set-duration-${exerciseIndex}-${setIndex}`}
                                    >
                                        Seconds
                                    </label>
                                    <input
                                        id={`set-duration-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={0}
                                        placeholder="Sec"
                                        value={set.durationSeconds ?? ''}
                                        onChange={(e) =>
                                            updateSet(
                                                exerciseIndex,
                                                setIndex,
                                                numericSetPatch(
                                                    'durationSeconds',
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={inputCls}
                                    />
                                    <label
                                        className="sr-only"
                                        htmlFor={`set-rpe-${exerciseIndex}-${setIndex}`}
                                    >
                                        RPE
                                    </label>
                                    <input
                                        id={`set-rpe-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={1}
                                        max={10}
                                        placeholder="RPE"
                                        value={set.rpe ?? ''}
                                        onChange={(e) =>
                                            updateSet(
                                                exerciseIndex,
                                                setIndex,
                                                numericSetPatch(
                                                    'rpe',
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        className={inputCls}
                                    />
                                    <button
                                        type="button"
                                        aria-label={
                                            set.completed
                                                ? 'Mark set incomplete'
                                                : 'Mark set complete'
                                        }
                                        onClick={() =>
                                            updateSet(exerciseIndex, setIndex, {
                                                completed: !set.completed,
                                            })
                                        }
                                        className={`${btnCls} ${set.completed ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200' : ''}`}
                                    >
                                        {set.completed ? 'Done' : 'Open'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    updateExercise(exerciseIndex, {
                                        sets: [...exercise.sets, makeSet()],
                                    })
                                }
                                className={btnCls}
                            >
                                Add set
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    updateExercise(exerciseIndex, {
                                        sets: [
                                            ...exercise.sets,
                                            makeSet(
                                                exercise.sets[
                                                    exercise.sets.length - 1
                                                ],
                                            ),
                                        ],
                                    })
                                }
                                className={btnCls}
                            >
                                Duplicate set
                            </button>
                        </div>
                    </div>
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
