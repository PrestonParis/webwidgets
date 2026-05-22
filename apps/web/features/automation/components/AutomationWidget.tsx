'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarClock, ShieldCheck, Workflow } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useAutomationCenter } from '@/features/automation/hooks/useAutomationCenter';
import {
    relativeTime,
    widgetEmoji,
} from '@/features/automation/lib/automationDisplay';
import { Toggle } from './AutomationBadges';

// The three key automations surfaced directly in the compact widget.
const KEY_AUTOMATION_IDS = [
    'inst-finance-spend-alert',
    'inst-news-digest',
    'inst-habits-nudge',
];

export default function AutomationWidget({
    widgetId = 'automation',
}: {
    widgetId?: string;
}) {
    const {
        instances,
        stats,
        approvals,
        nextDeliverable,
        latestFailed,
        globalEnabled,
        toggleAutomation,
        loading,
    } = useAutomationCenter();

    const keyInstances = KEY_AUTOMATION_IDS.map((id) =>
        instances.find((instance) => instance.id === id),
    ).filter((instance): instance is NonNullable<typeof instance> =>
        Boolean(instance),
    );

    return (
        <WidgetShell
            icon={<Workflow size={16} />}
            title="Automation"
            badge={globalEnabled ? 'On' : 'Paused'}
            widgetId={widgetId}
            widgetType="automation"
            footerHref="/automation"
            footerLabel="Open automation ->"
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                            Active
                        </p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {stats.active}
                        </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-400">
                            <ShieldCheck size={10} />
                            Approvals
                        </p>
                        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {approvals.length}
                        </p>
                    </div>
                </div>

                {nextDeliverable && (
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                        <CalendarClock
                            size={13}
                            className="shrink-0 text-zinc-400"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                {nextDeliverable.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                {relativeTime(nextDeliverable.nextGeneratedAt)}
                            </p>
                        </div>
                    </div>
                )}

                {latestFailed && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-950/40">
                        <AlertTriangle
                            size={13}
                            className="shrink-0 text-red-500"
                        />
                        <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-red-700 dark:text-red-300">
                            {latestFailed.definition.name} failed
                        </p>
                        <Link
                            href="/automation"
                            className="shrink-0 text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400"
                        >
                            Fix →
                        </Link>
                    </div>
                )}

                {!loading && keyInstances.length > 0 && (
                    <div className="space-y-1.5">
                        {keyInstances.map((instance) => {
                            const setupRequired =
                                instance.status === 'needs_setup' ||
                                instance.status === 'provider_missing';
                            return (
                                <div
                                    key={instance.id}
                                    className="flex items-center gap-2 rounded-lg border border-zinc-100 px-3 py-1.5 dark:border-zinc-800"
                                >
                                    <span className="text-sm leading-none">
                                        {widgetEmoji(
                                            instance.definition.widgetId,
                                        )}
                                    </span>
                                    <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                                        {instance.definition.name}
                                    </p>
                                    <Toggle
                                        enabled={instance.enabled}
                                        disabled={setupRequired}
                                        onClick={() =>
                                            toggleAutomation(instance.id)
                                        }
                                        label={`Toggle ${instance.definition.name}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
