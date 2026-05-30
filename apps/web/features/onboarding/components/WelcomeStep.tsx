'use client';

import { Check } from 'lucide-react';
import { GOAL_DEFINITIONS } from '@/features/onboarding/lib/goalDefinitions';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';
import { cn } from '@/lib/utils/utils';

interface WelcomeStepProps {
    selectedGoals: OnboardingGoalId[];
    onToggleGoal: (goalId: OnboardingGoalId) => void;
}

export function WelcomeStep({ selectedGoals, onToggleGoal }: WelcomeStepProps) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {GOAL_DEFINITIONS.map((goal) => {
                    const selected = selectedGoals.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            type="button"
                            onClick={() => onToggleGoal(goal.id)}
                            className={cn(
                                'group relative rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5',
                                selected
                                    ? 'border-[#4f6ef7] bg-[#eef2ff] shadow-md dark:bg-[#172033]'
                                    : 'border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                            )}
                        >
                            {selected && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#4f6ef7]">
                                    <Check className="h-3 w-3 text-white" />
                                </span>
                            )}
                            <span className="block text-3xl leading-none">
                                {goal.emoji}
                            </span>
                            <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {goal.label}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                {goal.summary}
                            </p>
                        </button>
                    );
                })}
            </div>
            {selectedGoals.length > 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selectedGoals.length} selected. You can always change this
                    later.
                </p>
            )}
        </div>
    );
}
