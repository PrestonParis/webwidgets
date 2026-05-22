'use client';

import { BellRing, Check, Repeat2 } from 'lucide-react';
import { AUTOMATION_DEFINITIONS } from '@/features/onboarding/lib/automationRegistry';

interface AutomationStepProps {
    suggestedIds: string[];
    enabledIds: string[];
    connectedIntegrationIds: string[];
    onToggle: (automationId: string) => void;
}

export function AutomationStep({
    suggestedIds,
    enabledIds,
    connectedIntegrationIds,
    onToggle,
}: AutomationStepProps) {
    const ordered = [...AUTOMATION_DEFINITIONS].sort(
        (a, b) =>
            Number(suggestedIds.includes(b.id)) -
            Number(suggestedIds.includes(a.id)),
    );

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {ordered.map((automation) => {
                const suggested = suggestedIds.includes(automation.id);
                const enabled = enabledIds.includes(automation.id);
                const blocked = automation.requiresIntegration
                    ? !connectedIntegrationIds.includes(
                          automation.requiresIntegration,
                      )
                    : false;
                return (
                    <button
                        key={automation.id}
                        type="button"
                        onClick={() => onToggle(automation.id)}
                        className={`rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 ${
                            enabled
                                ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        {automation.name}
                                    </h3>
                                    {suggested && (
                                        <span className="rounded-md bg-[#eef2ff] px-2 py-1 text-xs font-semibold text-[#4f6ef7]">
                                            Suggested
                                        </span>
                                    )}
                                    {blocked && (
                                        <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                            Needs{' '}
                                            {automation.requiresIntegration}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {automation.summary}
                                </p>
                            </div>
                            <span
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${enabled ? 'border-[#4f6ef7] bg-[#4f6ef7] text-white' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`}
                            >
                                {enabled ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Repeat2 className="h-4 w-4" />
                                )}
                            </span>
                        </div>
                    </button>
                );
            })}
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white/60 p-5 dark:border-zinc-700 dark:bg-zinc-900/60">
                <BellRing className="h-5 w-5 text-[#4f6ef7]" />
                <h3 className="mt-4 text-lg font-semibold">
                    Execution comes later
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    This flow stores intent and setup preferences. Automation
                    runners can attach to the same IDs when those systems are
                    ready.
                </p>
            </div>
        </div>
    );
}
