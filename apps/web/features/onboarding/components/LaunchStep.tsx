'use client';

import { Check } from 'lucide-react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import { INTEGRATION_PROVIDERS } from '@/features/onboarding/lib/integrationRegistry';

interface LaunchStepProps {
    connectedIntegrationIds: string[];
    selectedWidgetTypes: WidgetType[];
    enabledAutomationIds: string[];
    recommendation: WorkspaceRecommendation;
}

const WIDGET_LABELS: Partial<Record<string, string>> = {
    email: 'Email',
    calendar: 'Calendar',
    todo: 'Tasks',
    texteditor: 'Notes',
    timekeeping: 'Focus Timer',
    tracking: 'Health Tracking',
    'tracking-mood': 'Mood',
    weather: 'Weather',
    converter: 'Converter',
    datahealth: 'System Health',
    'form-filler': 'Form Filler',
    chess: 'Chess',
    'recovery-empty': 'Recovery',
};

function widgetLabel(type: string) {
    return (
        WIDGET_LABELS[type] ??
        type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

function formatId(id: string) {
    return id
        .split('-')
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ');
}

function CheckRow({ label }: { label: string }) {
    return (
        <li className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </span>
            {label}
        </li>
    );
}

export function LaunchStep({
    connectedIntegrationIds,
    selectedWidgetTypes,
    enabledAutomationIds,
    recommendation,
}: LaunchStepProps) {
    const connectedProviders = INTEGRATION_PROVIDERS.filter((p) =>
        connectedIntegrationIds.includes(p.id),
    );

    const automations =
        enabledAutomationIds.length > 0
            ? enabledAutomationIds
            : recommendation.automations.slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Your workspace is ready
                </p>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
                    Everything below has been set up for you. You can adjust any
                    of it from the dashboard.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {/* Integrations */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        Connected
                    </p>
                    {connectedProviders.length > 0 ? (
                        <ul className="space-y-2">
                            {connectedProviders.map((p) => (
                                <CheckRow key={p.id} label={p.name} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            No services connected. You can add them from
                            Settings.
                        </p>
                    )}
                </div>

                {/* Workspace widgets */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        Workspace
                    </p>
                    {selectedWidgetTypes.length > 0 ? (
                        <ul className="space-y-2">
                            {selectedWidgetTypes.slice(0, 6).map((type) => (
                                <CheckRow
                                    key={type}
                                    label={widgetLabel(type)}
                                />
                            ))}
                            {selectedWidgetTypes.length > 6 && (
                                <li className="text-xs text-zinc-400 dark:text-zinc-500">
                                    +{selectedWidgetTypes.length - 6} more
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            Default workspace will be created.
                        </p>
                    )}
                </div>

                {/* Automations */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        Automations
                    </p>
                    {automations.length > 0 ? (
                        <ul className="space-y-2">
                            {automations.slice(0, 5).map((id) => (
                                <CheckRow key={id} label={formatId(id)} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">
                            Automations can be enabled from Settings.
                        </p>
                    )}
                </div>
            </div>

            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
                You can always reconfigure your workspace from the dashboard.
            </p>
        </div>
    );
}
