'use client';

import { useState } from 'react';
import {
    STATUS_STYLES,
    ISSUE_TYPES,
    severityColor,
    type BodyIssue,
    type BodyIssueHistory,
    type IssueStatus,
} from '@/features/tracking/health/lib/bodyIssues';
import { SeveritySparkline } from '@/features/tracking/health/icons/HealthSparklines';

interface IssueCardProps {
    issue: BodyIssue;
    historyEntries: BodyIssueHistory[];
    onUpdate: (updates: Partial<BodyIssue>) => Promise<void>;
    onDelete: () => Promise<void>;
}

export function IssueCard({
    issue,
    historyEntries,
    onUpdate,
    onDelete,
}: IssueCardProps) {
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
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${s === issue.status ? 'cursor-default opacity-40' : 'border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
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
