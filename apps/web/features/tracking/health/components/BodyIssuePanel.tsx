'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from '@/features/ui/components/Modal';
import { BodyIssueForm } from './BodyIssueForm';
import { IssueCard } from './IssueCard';
import {
    type BodyIssue,
    type BodyIssueHistory,
    type BodyIssueDraft,
} from '@/features/tracking/health/lib/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';

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
        <Modal
            open
            onClose={onClose}
            size="md"
            aria-labelledby="body-issue-panel-title"
        >
            <ModalHeader
                id="body-issue-panel-title"
                title={regionName}
                description={
                    region
                        ? region.supportedTissueTypes.slice(0, 3).join(' · ')
                        : undefined
                }
                onClose={onClose}
            />
            <ModalBody>
                <div className="space-y-3">
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
