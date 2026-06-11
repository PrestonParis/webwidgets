'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/stepDefinitions';
import type { OnboardingStepDefinition } from '@/features/onboarding/types/goals';
import { cn } from '@/lib/utils/utils';

interface OnboardingShellProps {
    activeStep: OnboardingStepDefinition;
    stepIndex: number;
    canContinue: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
    children: React.ReactNode;
}

export function OnboardingShell({
    activeStep,
    stepIndex,
    canContinue,
    isFirstStep,
    isLastStep,
    onBack,
    onNext,
    onSkip,
    children,
}: OnboardingShellProps) {
    const progress = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;
    const total = ONBOARDING_STEPS.length;

    return (
        <div className="min-h-screen bg-[#f7f7f2] dark:bg-zinc-950">
            {/* Top bar */}
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
                <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        WebWidgets
                    </span>
                    <div className="flex flex-1 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                                className="h-full rounded-full bg-[#4f6ef7] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                            {stepIndex + 1} / {total}
                        </span>
                    </div>
                    {!isLastStep && (
                        <button
                            type="button"
                            onClick={onSkip}
                            className="text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                            Skip setup
                        </button>
                    )}
                </div>
            </div>

            {/* Step tabs */}
            <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto flex max-w-4xl gap-0 overflow-x-auto px-6">
                    {ONBOARDING_STEPS.map((step, index) => {
                        const active = step.id === activeStep.id;
                        const done = index < stepIndex;
                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                                    active
                                        ? 'border-[#4f6ef7] text-[#4f6ef7]'
                                        : done
                                          ? 'border-transparent text-zinc-400 dark:text-zinc-500'
                                          : 'border-transparent text-zinc-300 dark:text-zinc-600',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                        active
                                            ? 'bg-[#4f6ef7] text-white'
                                            : done
                                              ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                                              : 'bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600',
                                    )}
                                >
                                    {done ? '✓' : index + 1}
                                </span>
                                {step.label}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <main className="mx-auto max-w-4xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6ef7]">
                        {activeStep.eyebrow}
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {activeStep.title}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        {activeStep.description}
                    </p>
                </div>

                {children}
            </main>

            {/* Footer nav */}
            <div className="sticky bottom-0 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={isFirstStep}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        {!isLastStep && !canContinue && (
                            <button
                                type="button"
                                onClick={onNext}
                                className="text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                Skip this step
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!canContinue}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#4f6ef7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f5de2] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
                        >
                            {isLastStep ? 'Open Workspace' : 'Continue'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
