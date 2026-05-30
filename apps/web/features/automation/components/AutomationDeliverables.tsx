'use client';

import { FileOutput, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { EmptyState } from '@/features/ui/components/EmptyState';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { AutomationCenterController } from '@/features/automation/hooks/useAutomationCenter';
import type { AutomationDeliverable } from '@/features/automation/types/automation';
import {
    relativeTime,
    scheduleSummary,
} from '@/features/automation/lib/automationDisplay';
import { Toggle } from './AutomationBadges';

type OutputType = AutomationDeliverable['outputType'];
type Destination = AutomationDeliverable['deliveryDestination'];

const OUTPUT_LABELS: Record<OutputType, string> = {
    summary: 'Summary',
    report: 'Report',
    digest: 'Digest',
    briefing: 'Briefing',
    export: 'Export',
};

const DESTINATION_LABELS: Record<Destination, string> = {
    dashboard_notification: 'Dashboard notification',
    inbox: 'Inbox',
    email_draft: 'Email draft',
    calendar_suggestion: 'Calendar suggestion',
    download: 'Download',
};

function DeliverableRow({
    deliverable,
    onToggle,
}: {
    deliverable: AutomationDeliverable;
    onToggle: (id: string) => void;
}) {
    const external =
        deliverable.deliveryDestination === 'email_draft' ||
        deliverable.deliveryDestination === 'calendar_suggestion';

    return (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {deliverable.name}
                        </p>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {OUTPUT_LABELS[deliverable.outputType]}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                deliverable.approvalMode === 'review'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                            )}
                        >
                            {deliverable.approvalMode === 'review'
                                ? 'Review first'
                                : 'Auto'}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {deliverable.sourceWidgets.join(', ')}
                    </p>
                </div>
                <Toggle
                    enabled={deliverable.enabled}
                    onClick={() => onToggle(deliverable.id)}
                    label={`Toggle ${deliverable.name}`}
                />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950">
                    <p className="text-[10px] uppercase text-zinc-400">
                        Schedule
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {scheduleSummary(deliverable.schedule)}
                    </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950">
                    <p className="text-[10px] uppercase text-zinc-400">
                        Destination
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {DESTINATION_LABELS[deliverable.deliveryDestination]}
                    </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-950">
                    <p className="text-[10px] uppercase text-zinc-400">Next</p>
                    <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {deliverable.enabled
                            ? relativeTime(deliverable.nextGeneratedAt)
                            : 'Paused'}
                    </p>
                </div>
            </div>

            {external && (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                    Delivers to an external destination. Output is reviewed
                    before anything leaves your workspace.
                </p>
            )}
        </div>
    );
}

export function AutomationDeliverables({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const { deliverables, toggleDeliverable } = controller;
    const toast = useToastContext();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Recurring outputs assembled from your widgets.
                </p>
                <button
                    type="button"
                    onClick={() =>
                        toast.info('Deliverable builder coming soon')
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                >
                    <Plus size={13} />
                    Add deliverable
                </button>
            </div>

            {deliverables.length === 0 ? (
                <EmptyState
                    icon={FileOutput}
                    title="No deliverables scheduled"
                    description="Schedule digests, summaries, and reports built from your widgets."
                    action={{
                        label: 'Add deliverable',
                        onClick: () =>
                            toast.info('Deliverable builder coming soon'),
                    }}
                />
            ) : (
                <div className="grid gap-3">
                    {deliverables.map((deliverable) => (
                        <DeliverableRow
                            key={deliverable.id}
                            deliverable={deliverable}
                            onToggle={toggleDeliverable}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
