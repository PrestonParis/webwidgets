'use client';

import { BUILDER_STEPS } from '@/features/widgets/synthesis/widgetConstants';
import type { WidgetBuilderStepId } from '@/features/widgets/types/synthesisWidgets';

interface WidgetBuilderStepperProps {
    currentStepId: WidgetBuilderStepId;
    currentStepIndex: number;
    onGoToStep: (id: WidgetBuilderStepId) => void;
}

export function WidgetBuilderStepper({
    currentStepId,
    currentStepIndex,
    onGoToStep,
}: WidgetBuilderStepperProps) {
    return (
        <div className="flex flex-col gap-0.5">
            {BUILDER_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = step.id === currentStepId;
                const isLocked = index > currentStepIndex;

                return (
                    <button
                        key={step.id}
                        onClick={() => !isLocked && onGoToStep(step.id)}
                        disabled={isLocked}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                            isCurrent
                                ? 'bg-zinc-800 border border-zinc-600'
                                : isDone
                                  ? 'hover:bg-zinc-800/50'
                                  : 'opacity-40 cursor-not-allowed'
                        }`}
                    >
                        <div
                            className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                                isDone
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : isCurrent
                                      ? 'border-emerald-500 text-emerald-400'
                                      : 'border-zinc-700 text-zinc-600'
                            }`}
                        >
                            {isDone ? '✓' : index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p
                                className={`text-xs font-medium truncate ${
                                    isCurrent
                                        ? 'text-zinc-100'
                                        : isDone
                                          ? 'text-zinc-400'
                                          : 'text-zinc-600'
                                }`}
                            >
                                {step.label}
                            </p>
                            {isCurrent && (
                                <p className="text-[10px] text-zinc-500 truncate">
                                    {step.description}
                                </p>
                            )}
                        </div>

                        {step.optional && !isDone && !isCurrent && (
                            <span className="ml-auto text-[9px] text-zinc-700 shrink-0 font-medium">
                                opt
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
