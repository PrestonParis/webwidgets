'use client';

import { useState } from 'react';
import { Plug, Sparkles, X } from 'lucide-react';
import { EmptyState } from '@/features/ui/components/EmptyState';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { AutomationCenterController } from '@/features/automation/hooks/useAutomationCenter';
import { widgetEmoji } from '@/features/automation/lib/automationDisplay';
import { SafetyBadge } from './AutomationBadges';
import { createAutomation } from '@/features/automation/services/automationCenterService';
import type { V1TemplateDefinition } from '@/features/automation/lib/v1TemplateCatalog';

function boundedDefinition(value: unknown): V1TemplateDefinition | null {
    if (!value || typeof value !== 'object' || !('prohibitedEffects' in value))
        return null;
    return value as V1TemplateDefinition;
}

export function AutomationSuggestions({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const { suggestions, dismissSuggestion } = controller;
    const toast = useToastContext();
    const [enabling, setEnabling] = useState<string | null>(null);

    if (suggestions.length === 0) {
        return (
            <EmptyState
                icon={Sparkles}
                title="No suggestions right now"
                description="As you use your widgets, we will recommend safe automations tailored to your workflow."
            />
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion) => {
                const { definition } = suggestion;
                const bounded = boundedDefinition(definition);
                return (
                    <article
                        key={suggestion.id}
                        className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-2xl leading-none">
                                {widgetEmoji(definition.widgetId)}
                            </span>
                            <button
                                type="button"
                                aria-label="Dismiss suggestion"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {definition.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {definition.description}
                        </p>
                        <div className="mt-3 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950">
                            <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                                Why suggested
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                {suggestion.reason}
                            </p>
                        </div>
                        {bounded && (
                            <div className="mt-2 space-y-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                                <p>
                                    <strong>Trigger:</strong>{' '}
                                    {definition.trigger.label}
                                </p>
                                <p>
                                    <strong>Action:</strong>{' '}
                                    {definition.actions[0]?.label}
                                </p>
                                <p>
                                    <strong>Evidence:</strong>{' '}
                                    {definition.consent.dataRead.join(', ') ||
                                        'No source content'}
                                </p>
                                <p>
                                    <strong>Never:</strong>{' '}
                                    {bounded.prohibitedEffects.join(', ')}
                                </p>
                            </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <SafetyBadge level={definition.safetyLevel} />
                            {definition.consent.providersRequired.length >
                                0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    <Plug size={10} />
                                    {definition.consent.providersRequired.join(
                                        ', ',
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                type="button"
                                disabled={enabling === suggestion.id}
                                onClick={() => {
                                    void (async () => {
                                        setEnabling(suggestion.id);
                                        try {
                                            await createAutomation({
                                                userId: 'me',
                                                definitionId: definition.id,
                                            });
                                            toast.success(
                                                `"${definition.name}" created — enable it from Automations`,
                                            );
                                            window.location.reload();
                                        } catch {
                                            toast.error(
                                                'Failed to enable automation',
                                            );
                                        } finally {
                                            setEnabling(null);
                                        }
                                    })();
                                }}
                                className="flex-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {enabling === suggestion.id
                                    ? 'Enabling…'
                                    : 'Set up'}
                            </button>
                            <button
                                type="button"
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                Dismiss
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
