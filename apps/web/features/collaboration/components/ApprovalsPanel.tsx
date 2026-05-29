'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { useWorkspaceApprovals } from '../hooks/useWorkspaceApprovals';
import type { ApprovalRecord } from '../types/collaboration';

const statusStyles: Record<ApprovalRecord['status'], string> = {
    pending:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
    approved:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    rejected:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300',
    withdrawn:
        'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

const statusLabels: Record<ApprovalRecord['status'], string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

function StatusBadge({ status }: { status: ApprovalRecord['status'] }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                statusStyles[status],
            )}
        >
            {statusLabels[status]}
        </span>
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

interface ApprovalsPanelProps {
    workspaceId: string;
    currentUserId: string;
    canApprove: boolean;
}

export function ApprovalsPanel({
    workspaceId,
    currentUserId,
    canApprove,
}: ApprovalsPanelProps) {
    const toast = useToastContext();
    const { approvals, loading, createApproval, resolveApproval } =
        useWorkspaceApprovals(workspaceId);

    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            await createApproval(title.trim(), description.trim() || undefined);
            setTitle('');
            setDescription('');
            setShowForm(false);
            toast.success('Approval request created.');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to create approval.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResolve(
        approvalId: string,
        action: 'approve' | 'reject' | 'withdraw',
    ) {
        setResolvingId(approvalId);
        try {
            await resolveApproval(approvalId, action);
            const label =
                action === 'approve'
                    ? 'Approved.'
                    : action === 'reject'
                      ? 'Rejected.'
                      : 'Withdrawn.';
            toast.success(label);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to update approval.',
            );
        } finally {
            setResolvingId(null);
        }
    }

    if (loading) {
        return (
            <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading approvals…
            </div>
        );
    }

    const pending = approvals.filter((a) => a.status === 'pending');
    const resolved = approvals.filter((a) => a.status !== 'pending');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Approvals
                </h3>
                <Button
                    size="sm"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => setShowForm((v) => !v)}
                >
                    Request
                </Button>
            </div>

            {showForm && (
                <form
                    onSubmit={(e) => void handleCreate(e)}
                    className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900"
                >
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Approval title *"
                        required
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={submitting}>
                            Submit
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowForm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {approvals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No approval requests yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Pending
                            </p>
                            <ul className="space-y-2">
                                {pending.map((approval) => {
                                    const isRequester =
                                        approval.requester_id === currentUserId;
                                    const isResolving =
                                        resolvingId === approval.id;
                                    return (
                                        <li
                                            key={approval.id}
                                            className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {approval.title}
                                                    </p>
                                                    {approval.description && (
                                                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                                            {
                                                                approval.description
                                                            }
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                                                        Requested{' '}
                                                        {formatDate(
                                                            approval.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    status={approval.status}
                                                />
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {canApprove && !isRequester && (
                                                    <>
                                                        <Button
                                                            size="xs"
                                                            variant="secondary"
                                                            loading={
                                                                isResolving
                                                            }
                                                            onClick={() =>
                                                                void handleResolve(
                                                                    approval.id,
                                                                    'approve',
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="danger"
                                                            loading={
                                                                isResolving
                                                            }
                                                            onClick={() =>
                                                                void handleResolve(
                                                                    approval.id,
                                                                    'reject',
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {isRequester && (
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        loading={isResolving}
                                                        onClick={() =>
                                                            void handleResolve(
                                                                approval.id,
                                                                'withdraw',
                                                            )
                                                        }
                                                    >
                                                        Withdraw
                                                    </Button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {resolved.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                Resolved
                            </p>
                            <ul className="space-y-2">
                                {resolved.map((approval) => (
                                    <li
                                        key={approval.id}
                                        className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                    {approval.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-400">
                                                    {approval.resolved_at
                                                        ? `Resolved ${formatDate(approval.resolved_at)}`
                                                        : formatDate(
                                                              approval.created_at,
                                                          )}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={approval.status}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
