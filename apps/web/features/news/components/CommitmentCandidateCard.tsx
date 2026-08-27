'use client';

import { useState } from 'react';
import type { CommitmentCandidateCardProps } from '@/features/news/types/commitmentCandidates';
import type { CommitmentCandidateRecord } from '@/lib/commitments/types';

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
}: CommitmentCandidateCardProps) {
    const payload = payloadOf(candidate);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(stringField(payload, 'title'));
    const [notes, setNotes] = useState(stringField(payload, 'notes'));
    const [date, setDate] = useState(
        (
            stringField(payload, 'dueAt') || stringField(payload, 'startsAt')
        ).slice(0, 16),
    );
    const active = ['proposed', 'edited', 'approved'].includes(candidate.state);
    const save = () => {
        const iso = new Date(date).toISOString();
        const nextPayload =
            candidate.kind === 'task'
                ? { ...payload, title, notes, dueAt: iso }
                : {
                      ...payload,
                      title,
                      notes,
                      startsAt: iso,
                      endsAt: new Date(
                          Date.parse(iso) + 3_600_000,
                      ).toISOString(),
                  };
        onReview({
            decision: 'edit',
            expectedVersion: candidate.payloadVersion,
            kind: candidate.kind,
            payload: nextPayload,
        });
        setEditing(false);
    };
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
                <div className="mt-3 grid gap-2">
                    <label className="text-xs font-medium">
                        Title
                        <input
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                            onChange={(event) => setTitle(event.target.value)}
                            value={title}
                        />
                    </label>
                    <label className="text-xs font-medium">
                        Date and time
                        <input
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                            onChange={(event) => setDate(event.target.value)}
                            type="datetime-local"
                            value={date}
                        />
                    </label>
                    <label className="text-xs font-medium">
                        Notes
                        <textarea
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
                            onChange={(event) => setNotes(event.target.value)}
                            rows={2}
                            value={notes}
                        />
                    </label>
                    <button
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        disabled={disabled || !title.trim() || !date}
                        onClick={save}
                        type="button"
                    >
                        Save new version
                    </button>
                </div>
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
        </article>
    );
}

function ReviewButtons({
    candidate,
    disabled,
    onReview,
}: CommitmentCandidateCardProps) {
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
