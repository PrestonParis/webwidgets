'use client';

import { useState } from 'react';
import type { CommitmentCandidateCardProps } from '@/features/news/types/commitmentCandidates';
import type { CommitmentCandidateRecord } from '@/lib/commitments/types';
import { CommitmentCandidateEditor } from './CommitmentCandidateEditor';

function payloadOf(candidate: CommitmentCandidateRecord) {
    const value = candidate.payload;
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

function stringField(payload: Record<string, unknown>, key: string) {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
}

export function CommitmentCandidateCard({
    candidate,
    disabled,
    onReview,
    onRetry,
    onUndo,
}: CommitmentCandidateCardProps) {
    const payload = payloadOf(candidate);
    const [editing, setEditing] = useState(false);
    const date = (
        stringField(payload, 'dueAt') || stringField(payload, 'startsAt')
    ).slice(0, 16);
    const active = ['proposed', 'edited', 'approved'].includes(candidate.state);
    return (
        <article className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {candidate.kind} candidate · {candidate.state}
                    </p>
                    <h3 className="mt-1 font-semibold">
                        {stringField(payload, 'title')}
                    </h3>
                </div>
                <span className="text-xs text-zinc-500">
                    {Math.round(candidate.confidence * 100)}% confidence
                </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {candidate.reason}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
                {candidate.kind === 'task' ? 'Due' : 'Starts'}:{' '}
                {date ? new Date(date).toLocaleString() : 'Needs a date'}
            </p>
            {editing ? (
                <CommitmentCandidateEditor
                    candidate={candidate}
                    disabled={disabled}
                    onClose={() => setEditing(false)}
                    onReview={onReview}
                />
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
                {active ? (
                    <button
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                        disabled={disabled}
                        onClick={() => setEditing((value) => !value)}
                        type="button"
                    >
                        Edit
                    </button>
                ) : null}
                {active ? (
                    <ReviewButtons
                        candidate={candidate}
                        disabled={disabled}
                        onReview={onReview}
                    />
                ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                {candidate.evidence.map((event) => (
                    <a
                        className="text-xs text-emerald-700 underline dark:text-emerald-400"
                        href={`#timeline-${event.id}`}
                        key={event.id}
                    >
                        Evidence: {event.title}
                    </a>
                ))}
            </div>
            {candidate.state === 'approved' ? (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    Approved for the exact version shown. No action has been
                    executed.
                </p>
            ) : null}
            {candidate.execution ? (
                <ExecutionStatus
                    candidate={candidate}
                    disabled={disabled}
                    onRetry={onRetry}
                    onUndo={onUndo}
                />
            ) : null}
        </article>
    );
}

function ExecutionStatus({
    candidate,
    disabled,
    onRetry,
    onUndo,
}: Pick<
    CommitmentCandidateCardProps,
    'candidate' | 'disabled' | 'onRetry' | 'onUndo'
>) {
    const execution = candidate.execution;
    if (!execution) return null;
    const verified = execution.verificationStatus === 'verified';
    const retryable = ['queued', 'failed'].includes(execution.status);
    return (
        <div className="mt-3 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
            <p className="font-medium">
                {verified
                    ? `Task verified · ${execution.taskId}`
                    : `Execution ${execution.status}`}
            </p>
            {execution.failureCode ? (
                <p className="mt-1 text-red-600 dark:text-red-300">
                    {execution.failureCode}
                </p>
            ) : null}
            <div className="mt-2 flex gap-2">
                {retryable && !verified ? (
                    <button
                        className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700"
                        disabled={disabled}
                        onClick={() => onRetry(execution.actionRequestId)}
                        type="button"
                    >
                        Retry safely
                    </button>
                ) : null}
                {execution.undoStatus === 'available' ? (
                    <button
                        className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700"
                        disabled={disabled}
                        onClick={() => onUndo(execution.actionRequestId)}
                        type="button"
                    >
                        Undo
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function ReviewButtons({
    candidate,
    disabled,
    onReview,
}: Pick<CommitmentCandidateCardProps, 'candidate' | 'disabled' | 'onReview'>) {
    const decide = (decision: 'approve' | 'dismiss' | 'incorrect') =>
        onReview({
            decision,
            expectedVersion: candidate.payloadVersion,
            expectedHash: candidate.payloadHash,
        });
    return (
        <>
            <button
                className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
                disabled={disabled}
                onClick={() => decide('approve')}
                type="button"
            >
                Approve candidate
            </button>
            <button
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700"
                disabled={disabled}
                onClick={() => decide('dismiss')}
                type="button"
            >
                Dismiss
            </button>
            <button
                className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-900 dark:text-red-300"
                disabled={disabled}
                onClick={() => decide('incorrect')}
                type="button"
            >
                Incorrect
            </button>
        </>
    );
}
