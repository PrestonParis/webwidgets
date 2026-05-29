'use client';

import type {
    ExerciseEntry,
    SetEntry,
    SetType,
} from '@/features/tracking/types/fitness';
import {
    inputCls,
    btnCls,
    SET_TYPES,
    makeSet,
    numericSetPatch,
} from '@/features/tracking/lib/quickEntry/workoutFieldsUtils';

interface WorkoutExerciseRowProps {
    exercise: ExerciseEntry;
    exerciseIndex: number;
    onUpdate: (patch: Partial<ExerciseEntry>) => void;
    onRemove: () => void;
}

export function WorkoutExerciseRow({
    exercise,
    exerciseIndex,
    onUpdate,
    onRemove,
}: WorkoutExerciseRowProps) {
    const updateSet = (setIndex: number, patch: Partial<SetEntry>) => {
        onUpdate({
            sets: exercise.sets.map((set, j) =>
                j === setIndex ? { ...set, ...patch } : set,
            ),
        });
    };

    return (
        <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 p-2 space-y-2">
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
                        onUpdate({
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
                    onClick={onRemove}
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
                    onUpdate({
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
                                updateSet(setIndex, {
                                    setType: e.target.value as SetType,
                                })
                            }
                            className={inputCls}
                        >
                            {SET_TYPES.map((setType) => (
                                <option key={setType} value={setType}>
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
                                    setIndex,
                                    numericSetPatch('reps', e.target.value),
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
                                    setIndex,
                                    numericSetPatch('weight', e.target.value),
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
                                    setIndex,
                                    numericSetPatch('rpe', e.target.value),
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
                                updateSet(setIndex, {
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
                        onUpdate({ sets: [...exercise.sets, makeSet()] })
                    }
                    className={btnCls}
                >
                    Add set
                </button>
                <button
                    type="button"
                    onClick={() =>
                        onUpdate({
                            sets: [
                                ...exercise.sets,
                                makeSet(
                                    exercise.sets[exercise.sets.length - 1],
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
    );
}
