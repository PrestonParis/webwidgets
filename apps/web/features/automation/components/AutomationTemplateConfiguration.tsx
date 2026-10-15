'use client';

import { useState } from 'react';
import { FlaskConical, Play } from 'lucide-react';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { AutomationInstance } from '../types/automation';
import {
    configureAutomation,
    deleteAutomation,
    triggerAutomation,
} from '../services/automationCenterService';
import type { V1TemplateDefinition } from '../lib/v1TemplateCatalog';

function isBoundedTemplate(
    definition: AutomationInstance['definition'],
): definition is V1TemplateDefinition {
    return definition.id.startsWith('v1.') && 'prohibitedEffects' in definition;
}

export function AutomationTemplateConfiguration({
    instance,
}: {
    instance: AutomationInstance;
}) {
    const definition = instance.definition;
    const template = isBoundedTemplate(definition) ? definition : null;
    const [localTime, setLocalTime] = useState(instance.localTime ?? '09:00');
    const [timezone, setTimezone] = useState(
        instance.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone ??
            'UTC',
    );
    const [dryRun, setDryRun] = useState(instance.dryRun);
    const toast = useToastContext();

    const reloadAfter = async (
        operation: Promise<unknown>,
        message: string,
    ) => {
        try {
            await operation;
            toast.success(message);
            window.location.reload();
        } catch {
            toast.error('Automation command failed');
        }
    };

    return (
        <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <div className="grid gap-2 sm:grid-cols-2">
                <Preview label="Trigger" value={definition.trigger.label} />
                <Preview
                    label="Action"
                    value={definition.actions
                        .map((item) => item.label)
                        .join(', ')}
                />
                <Preview
                    label="Conditions"
                    value={definition.conditions
                        .map((item) => item.label)
                        .join('; ')}
                />
                <Preview
                    label="Evidence read"
                    value={definition.consent.dataRead.join(', ') || 'None'}
                />
            </div>
            {template && (
                <p className="rounded-lg bg-zinc-50 px-2.5 py-2 text-[11px] leading-5 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                    <strong>Never allowed:</strong>{' '}
                    {template.prohibitedEffects.join(', ')}. Version{' '}
                    {template.version}
                    {' · '}
                    {template.limits.runsPerHour} runs/hour
                    {' · '}
                    {template.limits.costBudgetCents}¢ cost cap.
                </p>
            )}
            {definition.schedule && (
                <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-[11px] text-zinc-500">
                        Local time
                        <input
                            type="time"
                            value={localTime}
                            onChange={(event) =>
                                setLocalTime(event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 text-xs dark:border-zinc-700"
                        />
                    </label>
                    <label className="text-[11px] text-zinc-500">
                        IANA timezone
                        <input
                            value={timezone}
                            onChange={(event) =>
                                setTimezone(event.target.value)
                            }
                            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 text-xs dark:border-zinc-700"
                        />
                    </label>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                <label className="inline-flex items-center gap-1.5">
                    <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(event) => setDryRun(event.target.checked)}
                    />
                    Dry-run mode
                </label>
                <span>
                    Approval:{' '}
                    {definition.approvalPolicy.required
                        ? 'always'
                        : 'not needed (read only)'}
                </span>
                {template && (
                    <button
                        type="button"
                        onClick={() =>
                            void reloadAfter(
                                configureAutomation(instance.id, {
                                    localTime,
                                    timezone,
                                    dryRun,
                                }),
                                'Template configuration saved',
                            )
                        }
                        className="font-semibold text-blue-600"
                    >
                        Save configuration
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={!instance.enabled}
                    onClick={() =>
                        void reloadAfter(
                            triggerAutomation(instance.id),
                            'Run started',
                        )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 disabled:text-zinc-400"
                >
                    <Play size={12} /> Run now
                </button>
                <button
                    type="button"
                    onClick={() =>
                        void reloadAfter(
                            triggerAutomation(instance.id, true),
                            'Dry run completed',
                        )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                >
                    <FlaskConical size={12} /> Dry run
                </button>
                <button
                    type="button"
                    onClick={() =>
                        void reloadAfter(
                            deleteAutomation(instance.id),
                            'Automation removed',
                        )
                    }
                    className="text-xs text-red-500"
                >
                    Remove automation
                </button>
            </div>
        </div>
    );
}

function Preview({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-medium uppercase text-zinc-400">
                {label}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{value}</p>
        </div>
    );
}
