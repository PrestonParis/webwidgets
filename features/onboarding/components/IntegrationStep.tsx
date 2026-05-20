'use client';

import { Check, FlaskConical, Lock, PlugZap } from 'lucide-react';
import type { IntegrationRuntimeState } from '@/features/onboarding/lib/integrationRegistry';
import type { IntegrationState } from '@/features/onboarding/types/integrations';

interface IntegrationStepProps {
    providers: IntegrationRuntimeState[];
    suggestedIds: string[];
    enabledIds: string[];
    skippedIds: string[];
    onToggle: (providerId: string) => void;
    onSkip: (providerId: string) => void;
    onConnect: (providerId: string) => void;
}

export function IntegrationStep({
    providers,
    suggestedIds,
    enabledIds,
    skippedIds,
    onToggle,
    onSkip,
    onConnect,
}: IntegrationStepProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {providers.map(({ provider, state }) => {
                const suggested = suggestedIds.includes(provider.id);
                const enabled =
                    enabledIds.includes(provider.id) || state === 'connected';
                const skipped = skippedIds.includes(provider.id);
                const displayState: IntegrationState =
                    skipped && state !== 'connected' ? 'skipped' : state;
                return (
                    <article
                        key={provider.id}
                        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold">
                                        {provider.name}
                                    </h3>
                                    <StateBadge state={displayState} />
                                    {suggested && (
                                        <span className="rounded-md bg-[#eef2ff] px-2 py-1 text-xs font-semibold text-[#4f6ef7]">
                                            Suggested
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {provider.summary}
                                </p>
                            </div>
                            <PlugZap className="h-5 w-5 text-[#4f6ef7]" />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {provider.scopes.map((scope) => (
                                <span
                                    key={scope}
                                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                                >
                                    {scope}
                                </span>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            {state === 'available' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!enabled) onToggle(provider.id);
                                        onConnect(provider.id);
                                    }}
                                    className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                                >
                                    Connect
                                </button>
                            )}
                            {state !== 'available' && state !== 'connected' && (
                                <button
                                    type="button"
                                    onClick={() => onToggle(provider.id)}
                                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-950"
                                >
                                    {enabled ? 'Included' : 'Include later'}
                                </button>
                            )}
                            {state !== 'connected' && (
                                <button
                                    type="button"
                                    onClick={() => onSkip(provider.id)}
                                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-950"
                                >
                                    {skipped ? 'Skipped' : 'Skip'}
                                </button>
                            )}
                            {state === 'connected' && (
                                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                                    <Check className="h-4 w-4" />
                                    Connected
                                </span>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function StateBadge({ state }: { state: IntegrationState }) {
    const copy: Record<IntegrationState, string> = {
        connected: 'Connected',
        available: 'Available',
        beta: 'Beta',
        unavailable: 'Unavailable',
        error: 'Error',
        skipped: 'Skipped',
        'coming-soon': 'Coming soon',
    };
    const Icon =
        state === 'beta'
            ? FlaskConical
            : state === 'coming-soon'
              ? Lock
              : Check;
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Icon className="h-3.5 w-3.5" />
            {copy[state]}
        </span>
    );
}
