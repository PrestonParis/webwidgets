'use client';

import { useState } from 'react';
import type { Candidate } from '../types/commandCenter';

function field(candidate: Candidate, key: string) {
    const value = candidate.payload[key];
    return typeof value === 'string' ? value : '';
}

export function CandidateReview({
    candidate,
    disabled,
    onReview,
}: {
    candidate: Candidate;
    disabled: boolean;
    onReview: (body: Record<string, unknown>) => void;
}) {
    const [editing, setEditing] = useState(false);
    const decide = (decision: 'approve' | 'dismiss' | 'incorrect') =>
        onReview({
            decision,
            expectedVersion: candidate.payloadVersion,
            expectedHash: candidate.payloadHash,
        });
    return (
        <article className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {candidate.kind} · {candidate.state}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">
                        {field(candidate, 'title') || 'Untitled candidate'}
                    </h3>
                </div>
                <span className="text-[11px] text-zinc-500">
                    {Math.round(candidate.confidence * 100)}% confidence
                </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
                {candidate.reason}
            </p>
            {candidate.evidence.length ? (
                <p className="mt-2 text-[11px] text-zinc-500">
                    Evidence:{' '}
                    {candidate.evidence.map((item) => item.title).join(', ')}
                </p>
            ) : null}
            {editing ? (
                <CandidateEditor
                    candidate={candidate}
                    disabled={disabled}
                    onCancel={() => setEditing(false)}
                    onSave={onReview}
                />
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs dark:border-zinc-700"
                    disabled={disabled}
                    onClick={() => setEditing((value) => !value)}
                    type="button"
                >
                    Edit
                </button>
                <button
                    className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => decide('approve')}
                    type="button"
                >
                    Approve exact version
                </button>
                <button
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs dark:border-zinc-700"
                    disabled={disabled}
                    onClick={() => decide('dismiss')}
                    type="button"
                >
                    Dismiss
                </button>
                <button
                    className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs text-red-700 dark:border-red-900 dark:text-red-300"
                    disabled={disabled}
                    onClick={() => decide('incorrect')}
                    type="button"
                >
                    Incorrect
                </button>
            </div>
        </article>
    );
}

function CandidateEditor({
    candidate,
    disabled,
    onCancel,
    onSave,
}: {
    candidate: Candidate;
    disabled: boolean;
    onCancel: () => void;
    onSave: (body: Record<string, unknown>) => void;
}) {
    const [title, setTitle] = useState(field(candidate, 'title'));
    const [notes, setNotes] = useState(field(candidate, 'notes'));
    const sourceDate =
        field(candidate, 'dueAt') || field(candidate, 'startsAt');
    const [date, setDate] = useState(sourceDate.slice(0, 16));
    const save = () => {
        if (!title.trim() || !date || Number.isNaN(Date.parse(date))) return;
        const dateKey = candidate.kind === 'task' ? 'dueAt' : 'startsAt';
        onSave({
            decision: 'edit',
            expectedVersion: candidate.payloadVersion,
            expectedHash: candidate.payloadHash,
            payload: {
                ...candidate.payload,
                title: title.trim(),
                notes: notes.trim(),
                [dateKey]: new Date(date).toISOString(),
            },
        });
        onCancel();
    };
    return (
        <div className="mt-3 grid gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <label className="grid gap-1 text-xs font-medium">
                Title
                <input
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
                    maxLength={500}
                    onChange={(event) => setTitle(event.target.value)}
                    value={title}
                />
            </label>
            <label className="grid gap-1 text-xs font-medium">
                Notes
                <textarea
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
                    maxLength={4000}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    value={notes}
                />
            </label>
            <label className="grid gap-1 text-xs font-medium">
                {candidate.kind === 'task' ? 'Due' : 'Starts'}
                <input
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
                    onChange={(event) => setDate(event.target.value)}
                    type="datetime-local"
                    value={date}
                />
            </label>
            <div className="flex gap-2">
                <button
                    className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
                    disabled={disabled || !title.trim() || !date}
                    onClick={save}
                    type="button"
                >
                    Save revision
                </button>
                <button
                    className="px-2.5 py-1.5 text-xs"
                    onClick={onCancel}
                    type="button"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
