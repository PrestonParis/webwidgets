'use client';

import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { PomodoroStep, PomodoroStepKind } from '../types/timekeeping';
import { DurationFields } from './DurationFields';

interface PomodoroPlanEditorProps {
    steps: PomodoroStep[];
    currentStepIndex: number;
    planCycles: number;
    completedPlanCycles: number;
    running: boolean;
    autoStartNext: boolean;
    onAddStep: (kind: PomodoroStepKind) => void;
    onRemoveStep: (id: string) => void;
    onStepKindChange: (id: string, kind: PomodoroStepKind) => void;
    onStepDurationChange: (id: string, durationSeconds: number) => void;
    onPlanCyclesChange: (cycles: number) => void;
    onAutoStartNextChange: (enabled: boolean) => void;
}

export function PomodoroPlanEditor({
    steps,
    currentStepIndex,
    planCycles,
    completedPlanCycles,
    running,
    autoStartNext,
    onAddStep,
    onRemoveStep,
    onStepKindChange,
    onStepDurationChange,
    onPlanCyclesChange,
    onAutoStartNextChange,
}: PomodoroPlanEditorProps) {
    const visibleCycle = Math.min(completedPlanCycles + 1, planCycles);

    return (
        <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
                    <span className="font-medium">Cycles</span>
                    <input
                        type="number"
                        min={1}
                        max={12}
                        step={1}
                        value={planCycles}
                        disabled={running}
                        onChange={(event) =>
                            onPlanCyclesChange(Number(event.target.value || 1))
                        }
                        className="h-7 w-14 rounded-lg border border-stone-200 bg-white text-center font-mono text-stone-800 outline-none focus:border-sky-300 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </label>
                <span className="text-[10px] font-medium text-stone-400 dark:text-zinc-500">
                    {visibleCycle}/{planCycles}
                </span>
            </div>

            <button
                type="button"
                onClick={() => onAutoStartNextChange(!autoStartNext)}
                className="flex w-full items-center justify-between rounded-lg bg-stone-100 px-2.5 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
                <span>Auto-start next</span>
                <span
                    className={cn(
                        'h-4 w-7 rounded-full transition-colors',
                        autoStartNext
                            ? 'bg-stone-800 dark:bg-zinc-100'
                            : 'bg-stone-300 dark:bg-zinc-600',
                    )}
                >
                    <span
                        className={cn(
                            'mt-0.5 block h-3 w-3 rounded-full bg-white transition-all dark:bg-zinc-900',
                            autoStartNext ? 'ml-3.5' : 'ml-0.5',
                        )}
                    />
                </span>
            </button>

            <div className="space-y-1.5">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={cn(
                            'grid grid-cols-[4.5rem_1fr_1.75rem] items-center gap-1.5 rounded-lg border px-2 py-1.5',
                            index === currentStepIndex
                                ? 'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/30'
                                : 'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
                        )}
                    >
                        <select
                            value={step.kind}
                            disabled={running}
                            onChange={(event) =>
                                onStepKindChange(
                                    step.id,
                                    event.target.value as PomodoroStepKind,
                                )
                            }
                            className="h-7 min-w-0 rounded-md border-0 bg-transparent text-xs font-medium text-stone-700 outline-none disabled:opacity-60 dark:text-zinc-200"
                        >
                            <option value="focus">Focus</option>
                            <option value="break">Break</option>
                        </select>
                        <DurationFields
                            seconds={step.durationSeconds}
                            disabled={running}
                            compact
                            onChange={(durationSeconds) =>
                                onStepDurationChange(step.id, durationSeconds)
                            }
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveStep(step.id)}
                            disabled={running || steps.length <= 1}
                            title="Remove step"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
                <button
                    type="button"
                    onClick={() => onAddStep('focus')}
                    disabled={running || steps.length >= 12}
                    className="flex items-center justify-center gap-1 rounded-lg bg-stone-100 px-2 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                    <Plus size={12} /> Focus
                </button>
                <button
                    type="button"
                    onClick={() => onAddStep('break')}
                    disabled={running || steps.length >= 12}
                    className="flex items-center justify-center gap-1 rounded-lg bg-stone-100 px-2 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                    <Plus size={12} /> Break
                </button>
            </div>
        </div>
    );
}
