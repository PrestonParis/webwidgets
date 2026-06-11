'use client';

import { Check, ChevronRight, FlaskConical, Lock } from 'lucide-react';
import type { IntegrationRuntimeState } from '@/features/onboarding/lib/integrationRegistry';
import type { IntegrationState } from '@/features/onboarding/types/integrations';
import { cn } from '@/lib/utils/utils';

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
    const available = providers.filter(
        ({ provider }) =>
            provider.state === 'available' || provider.state === 'beta',
    );
    const comingSoon = providers.filter(
        ({ provider }) => provider.state === 'coming-soon',
    );

    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
                {available.map(({ provider, state }) => {
                    const connected = state === 'connected';
                    const suggested = suggestedIds.includes(provider.id);
                    return (
                        <article
                            key={provider.id}
                            className={cn(
                                'rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-zinc-900',
                                connected
                                    ? 'border-emerald-200 dark:border-emerald-900'
                                    : 'border-zinc-200 dark:border-zinc-800',
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                            {provider.name}
                                        </h3>
                                        {provider.state === 'beta' && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                <FlaskConical className="h-3 w-3" />
                                                Beta
                                            </span>
                                        )}
                                        {suggested && !connected && (
                                            <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold text-[#4f6ef7] dark:bg-[#172033]">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                        {provider.summary}
                                    </p>
                                </div>
                                {connected && (
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                )}
                            </div>

                            <ul className="mt-4 space-y-1.5">
                                {provider.outcomes.map((outcome) => (
                                    <li
                                        key={outcome}
                                        className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                                    >
                                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4f6ef7]" />
                                        {outcome}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-5">
                                {connected ? (
                                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                        Connected
                                    </span>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    !enabledIds.includes(
                                                        provider.id,
                                                    )
                                                )
                                                    onToggle(provider.id);
                                                onConnect(provider.id);
                                            }}
                                            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                        >
                                            Connect
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSkip(provider.id)}
                                            className={cn(
                                                'rounded-lg border px-4 py-2 text-sm font-medium transition',
                                                skippedIds.includes(provider.id)
                                                    ? 'border-zinc-300 text-zinc-400 dark:border-zinc-700'
                                                    : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950',
                                            )}
                                        >
                                            {skippedIds.includes(provider.id)
                                                ? 'Skipped'
                                                : 'Skip for now'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {comingSoon.length > 0 && (
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        Coming soon
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {comingSoon.map(({ provider }) => (
                            <div
                                key={provider.id}
                                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <Lock className="h-4 w-4 shrink-0 text-zinc-400" />
                                <div>
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        {provider.name}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {provider.summary}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Keep StateBadge export for any remaining usages
export function StateBadge({ state }: { state: IntegrationState }) {
    const copy: Record<IntegrationState, string> = {
        connected: 'Connected',
        available: 'Available',
        beta: 'Beta',
        unavailable: 'Unavailable',
        error: 'Error',
        skipped: 'Skipped',
        'coming-soon': 'Coming soon',
    };
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {copy[state]}
        </span>
    );
}
