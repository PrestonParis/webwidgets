'use client';

import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/stepDefinitions';
import type { OnboardingStepDefinition } from '@/features/onboarding/types/goals';

interface OnboardingShellProps {
    activeStep: OnboardingStepDefinition;
    stepIndex: number;
    canContinue: boolean;
    isFirstStep: boolean;
    isLastStep: boolean;
    onBack: () => void;
    onNext: () => void;
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
    children,
}: OnboardingShellProps) {
    const progress = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-[#f7f7f2] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
            <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[320px_1fr]">
                <aside className="border-b border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70 lg:border-b-0 lg:border-r lg:p-8">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                WebWidgets
                            </p>
                            <h1 className="text-base font-semibold">
                                Setup Console
                            </h1>
                        </div>
                    </div>

                    <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                            className="h-full rounded-full bg-[#4f6ef7] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <nav className="space-y-2">
                        {ONBOARDING_STEPS.map((step, index) => {
                            const active = step.id === activeStep.id;
                            const done = index < stepIndex;
                            return (
                                <div
                                    key={step.id}
                                    className={`rounded-lg border px-3 py-3 transition ${
                                        active
                                            ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                                            : 'border-transparent text-zinc-500 dark:text-zinc-400'
                                    }`}
                                >
                                    <p className="text-xs font-medium">
                                        {done ? 'Configured' : step.eyebrow}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {step.label}
                                    </p>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                <section className="flex min-h-screen flex-col">
                    <div className="border-b border-zinc-200 bg-white/55 px-6 py-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/55 lg:px-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4f6ef7]">
                            {activeStep.eyebrow}
                        </p>
                        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="max-w-3xl text-3xl font-semibold tracking-normal lg:text-4xl">
                                    {activeStep.title}
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {activeStep.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 px-6 py-7 lg:px-10">{children}</div>

                    <footer className="sticky bottom-0 flex items-center justify-between border-t border-zinc-200 bg-white/85 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85 lg:px-10">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={isFirstStep}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!canContinue}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#4f6ef7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f5de2] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                        >
                            {isLastStep ? 'Open workspace' : 'Continue'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </footer>
                </section>
            </main>
        </div>
    );
}
