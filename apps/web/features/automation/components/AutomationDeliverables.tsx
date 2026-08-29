'use client';

import { useState } from 'react';
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
    const { deliverables, toggleDeliverable, createDeliverable } = controller;
    const toast = useToastContext();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [outputType, setOutputType] = useState<
        'summary' | 'report' | 'digest'
    >('digest');
    const [destination, setDestination] = useState<
        'dashboard_notification' | 'download'
    >('dashboard_notification');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Recurring outputs assembled from your widgets.
                </p>
                <button
                    type="button"
                    onClick={() => setShowCreate((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                >
                    <Plus size={13} />
                    {showCreate ? 'Cancel' : 'Add deliverable'}
                </button>
            </div>

            {showCreate && (
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        New deliverable
                    </p>
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Deliverable name"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] uppercase text-zinc-400 mb-1">
                                Output type
                            </p>
                            <select
                                value={outputType}
                                onChange={(e) =>
                                    setOutputType(
                                        e.target.value as typeof outputType,
                                    )
                                }
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="digest">Digest</option>
                                <option value="summary">Summary</option>
                                <option value="report">Report</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-zinc-400 mb-1">
                                Destination
                            </p>
                            <select
                                value={destination}
                                onChange={(e) =>
                                    setDestination(
                                        e.target.value as typeof destination,
                                    )
                                }
                                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="dashboard_notification">
                                    Dashboard
                                </option>
                                <option value="download">Download</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!newName.trim()) return;
                            void createDeliverable(
                                newName.trim(),
                                outputType,
                                destination,
                            )
                                .then(() => {
                                    toast.success(
                                        `"${newName}" saved as paused`,
                                    );
                                    setShowCreate(false);
                                    setNewName('');
                                })
                                .catch(() =>
                                    toast.error(
                                        'Deliverable could not be saved',
                                    ),
                                );
                        }}
                        className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-xs font-semibold text-white dark:text-zinc-900"
                    >
                        Schedule deliverable
                    </button>
                </div>
            )}

            {deliverables.length === 0 ? (
                <EmptyState
                    icon={FileOutput}
                    title="No deliverables scheduled"
                    description="Schedule digests, summaries, and reports built from your widgets."
                    action={{
                        label: 'Add deliverable',
                        onClick: () => setShowCreate(true),
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
