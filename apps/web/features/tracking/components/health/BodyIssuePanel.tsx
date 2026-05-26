'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from '@/features/ui/components/Modal';
import { BodyIssueForm } from './BodyIssueForm';
import {
    STATUS_STYLES,
    ISSUE_TYPES,
    severityColor,
    type BodyIssue,
    type BodyIssueHistory,
    type BodyIssueDraft,
    type IssueStatus,
} from '@/features/tracking/lib/health/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/lib/health/bodyRegions';

interface BodyIssuePanelProps {
    regionId: string;
    regionName?: string;
    issues: BodyIssue[];
    history: Map<string, BodyIssueHistory[]>;
    onUpdateIssue: (id: string, updates: Partial<BodyIssue>) => Promise<void>;
    onDeleteIssue: (id: string) => Promise<void>;
    onResolveAll: () => Promise<void>;
    onAddIssue: (draft: BodyIssueDraft) => Promise<void>;
    initialDraft?: Partial<BodyIssueDraft>;
    onClose: () => void;
}

/** Tiny inline SVG sparkline for severity history */
function SeveritySparkline({ entries }: { entries: BodyIssueHistory[] }) {
    if (entries.length < 2) return null;
    const values = entries.map((e) => e.severity);
    const W = 48;
    const H = 16;
    const maxV = 10;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * W;
        const y = H - (v / maxV) * H;
        return `${x},${y}`;
    });
    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="shrink-0"
            aria-hidden
        >
            <polyline
                points={pts.join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IssueCard({
    issue,
    historyEntries,
    onUpdate,
    onDelete,
}: {
    issue: BodyIssue;
    historyEntries: BodyIssueHistory[];
    onUpdate: (updates: Partial<BodyIssue>) => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const typeInfo = ISSUE_TYPES.find((t) => t.id === issue.issueType);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<IssueStatus | null>(
        null,
    );

    async function handleStatusChange(s: IssueStatus) {
        setUpdatingStatus(s);
        try {
            await onUpdate({ status: s });
        } finally {
            setUpdatingStatus(null);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await onDelete();
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {typeInfo && (
                            <span className="text-base leading-none">
                                {typeInfo.emoji}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 capitalize">
                            {typeInfo?.label ?? issue.issueType}
                        </span>
                        <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[issue.status]}`}
                        >
                            {issue.status}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                        Onset: {issue.onsetDate} · {issue.durationType}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <SeveritySparkline entries={historyEntries} />
                    <div className="flex flex-col items-end gap-0.5">
                        <span
                            className="text-sm font-bold"
                            style={{ color: severityColor(issue.severity) }}
                        >
                            {issue.severity}/10
                        </span>
                        <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${(issue.severity / 10) * 100}%`,
                                    backgroundColor: severityColor(
                                        issue.severity,
                                    ),
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {issue.notes && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                    {issue.notes}
                </p>
            )}

            {issue.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {issue.triggers.map((t) => (
                        <span
                            key={t}
                            className="rounded-full bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300 capitalize"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex gap-1">
                    {(['active', 'improving', 'resolved'] as IssueStatus[]).map(
                        (s) => (
                            <button
                                key={s}
                                type="button"
                                disabled={
                                    s === issue.status ||
                                    updatingStatus !== null
                                }
                                onClick={() => void handleStatusChange(s)}
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                                    s === issue.status
                                        ? 'cursor-default opacity-40'
                                        : 'border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
                                }`}
                            >
                                {updatingStatus === s ? '…' : s}
                            </button>
                        ),
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="text-[11px] text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                    {deleting ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    );
}

export function BodyIssuePanel({
    regionId,
    regionName: regionNameOverride,
    issues,
    history,
    onUpdateIssue,
    onDeleteIssue,
    onResolveAll,
    onAddIssue,
    initialDraft,
    onClose,
}: BodyIssuePanelProps) {
    const [showForm, setShowForm] = useState(issues.length === 0);
    const [resolvingAll, setResolvingAll] = useState(false);

    const region = BODY_REGION_MAP[regionId];
    const regionName = regionNameOverride ?? region?.displayName ?? regionId;
    const hasActive = issues.some((i) => i.status !== 'resolved');

    const headerId = 'body-issue-panel-title';

    async function handleResolveAll() {
        setResolvingAll(true);
        try {
            await onResolveAll();
        } finally {
            setResolvingAll(false);
        }
    }

    async function handleAddIssue(draft: BodyIssueDraft) {
        await onAddIssue(draft);
        setShowForm(false);
    }

    return (
        <Modal open onClose={onClose} size="md" aria-labelledby={headerId}>
            <ModalHeader
                id={headerId}
                title={regionName}
                description={
                    region
                        ? `${region.supportedTissueTypes.slice(0, 3).join(' · ')}`
                        : undefined
                }
                onClose={onClose}
            />
            <ModalBody>
                <div className="space-y-3">
                    {/* Action bar */}
                    {issues.length > 0 && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500 dark:text-zinc-400">
                                {issues.length} issue
                                {issues.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex gap-2">
                                {hasActive && (
                                    <button
                                        type="button"
                                        onClick={() => void handleResolveAll()}
                                        disabled={resolvingAll}
                                        className="rounded-lg border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50"
                                    >
                                        {resolvingAll
                                            ? 'Resolving…'
                                            : 'Mark all resolved'}
                                    </button>
                                )}
                                {!showForm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(true)}
                                        className="rounded-lg bg-indigo-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-600"
                                    >
                                        + Add issue
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Existing issues */}
                    {issues.length > 0 && !showForm && (
                        <div className="space-y-2">
                            {issues.map((issue) => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    historyEntries={history.get(issue.id) ?? []}
                                    onUpdate={(updates) =>
                                        onUpdateIssue(issue.id, updates)
                                    }
                                    onDelete={() => onDeleteIssue(issue.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {issues.length === 0 && !showForm && (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-400 dark:text-zinc-500">
                                No issues logged for this region.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="mt-3 rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
                            >
                                Log an issue
                            </button>
                        </div>
                    )}

                    {/* Inline add form */}
                    {showForm && (
                        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10 p-3">
                            <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                {issues.length === 0
                                    ? 'Log issue'
                                    : 'Add another issue'}
                            </p>
                            <BodyIssueForm
                                regionId={regionId}
                                regionName={regionName}
                                onSave={handleAddIssue}
                                initialDraft={initialDraft}
                                onCancel={() => {
                                    if (issues.length === 0) {
                                        onClose();
                                    } else {
                                        setShowForm(false);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
}
