'use client';

import { AlertTriangle, Check, FilePen, ShieldCheck, X } from 'lucide-react';
import { EmptyState } from '@/features/ui/components/EmptyState';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import type { AutomationCenterController } from '@/features/automation/hooks/useAutomationCenter';
import type { AutomationApproval } from '@/features/automation/types/automation';
import { relativeTime } from '@/features/automation/lib/automationDisplay';

function ApprovalCard({
    approval,
    onApprove,
    onReject,
    onEdit,
}: {
    approval: AutomationApproval;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onEdit: () => void;
}) {
    return (
        <article className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {approval.automationName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {approval.widgetName} ·{' '}
                        {relativeTime(approval.createdAt)}
                    </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    <ShieldCheck size={10} />
                    Pending
                </span>
            </div>

            <div className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
                <p className="text-[10px] uppercase text-zinc-400">
                    Proposed action
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {approval.proposedAction}
                </p>
            </div>

            {approval.outputPreview && (
                <div className="mt-2 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                    <p className="text-[10px] uppercase text-zinc-400">
                        Output preview
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                        {approval.outputPreview}
                    </p>
                </div>
            )}

            {approval.externalEffectWarning && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                    <AlertTriangle
                        size={14}
                        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <p className="text-[11px] leading-5 text-amber-700 dark:text-amber-300">
                        {approval.externalEffectWarning}
                    </p>
                </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => onApprove(approval.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                    <Check size={13} />
                    Approve
                </button>
                <button
                    type="button"
                    onClick={() => onReject(approval.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <X size={13} />
                    Reject
                </button>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <FilePen size={13} />
                    Edit before approving
                </button>
            </div>
        </article>
    );
}

export function AutomationApprovals({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const { approvals, approveRun, rejectRun } = controller;
    const toast = useToastContext();

    if (approvals.length === 0) {
        return (
            <EmptyState
                icon={ShieldCheck}
                title="No pending approvals"
                description="When an automation proposes an action that needs your sign-off, it will appear here for review."
            />
        );
    }

    return (
        <div className="grid gap-3">
            {approvals.map((approval) => (
                <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    onApprove={(id) => {
                        approveRun(id);
                        toast.success('Action approved');
                    }}
                    onReject={(id) => {
                        rejectRun(id);
                        toast.info('Action rejected');
                    }}
                    onEdit={() =>
                        toast.info('Editing before approval coming soon')
                    }
                />
            ))}
        </div>
    );
}
