'use client';

import { useState } from 'react';
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

export function CommitmentCandidateEditor({
    candidate,
    disabled,
    onClose,
    onReview,
}: {
    candidate: CommitmentCandidateRecord;
    disabled: boolean;
    onClose: () => void;
    onReview: (body: Record<string, unknown>) => void;
}) {
    const payload = payloadOf(candidate);
    const [title, setTitle] = useState(stringField(payload, 'title'));
    const [notes, setNotes] = useState(stringField(payload, 'notes'));
    const [date, setDate] = useState(
        (
            stringField(payload, 'dueAt') || stringField(payload, 'startsAt')
        ).slice(0, 16),
    );
    const save = () => {
        const iso = new Date(date).toISOString();
        onReview({
            decision: 'edit',
            expectedVersion: candidate.payloadVersion,
            kind: candidate.kind,
            payload:
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
                      },
        });
        onClose();
    };
    return (
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
    );
}
