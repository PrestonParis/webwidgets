'use client';

import { Check } from 'lucide-react';
import { GOAL_DEFINITIONS } from '@/features/onboarding/lib/goalDefinitions';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

interface GoalDiscoveryStepProps {
    selectedGoals: OnboardingGoalId[];
    intent: string;
    onToggleGoal: (goalId: OnboardingGoalId) => void;
    onIntentChange: (intent: string) => void;
}

export function GoalDiscoveryStep({
    selectedGoals,
    intent,
    onToggleGoal,
    onIntentChange,
}: GoalDiscoveryStepProps) {
    return (
        <div className="space-y-5">
            <label className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-sm font-semibold">
                    What are you trying to accomplish?
                </span>
                <textarea
                    value={intent}
                    onChange={(event) => onIntentChange(event.target.value)}
                    rows={4}
                    className="mt-3 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#4f6ef7] dark:border-zinc-800 dark:bg-zinc-950"
                    placeholder="Example: I want a recovery-focused dashboard with mood check-ins, sleep tracking, fewer distractions, and gentle reminders."
                />
            </label>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {GOAL_DEFINITIONS.map((goal) => {
                    const selected = selectedGoals.includes(goal.id);
                    return (
                        <button
                            key={goal.id}
                            type="button"
                            onClick={() => onToggleGoal(goal.id)}
                            className={`group rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 ${
                                selected
                                    ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold">
                                        {goal.label}
                                    </h3>
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                        {goal.summary}
                                    </p>
                                </div>
                                <span
                                    className={`grid h-6 w-6 place-items-center rounded-md border ${
                                        selected
                                            ? 'border-[#4f6ef7] bg-[#4f6ef7] text-white'
                                            : 'border-zinc-300 text-transparent dark:border-zinc-700'
                                    }`}
                                >
                                    <Check className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                {goal.details}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
