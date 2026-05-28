'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getConversionJob,
    getDownloadUrl,
} from '@/features/convert/lib/conversionClient';
import type { ConversionJob } from '@/features/convert/types/conversion';

export interface JobEntry {
    file: File;
    job: ConversionJob | null;
    localUrl: string | null;
    downloadUrl: string | null;
    targetExtension: string | null;
    error: string | null;
}

export function useConversionJobs() {
    const [entries, setEntries] = useState<JobEntry[]>([]);
    const entriesRef = useRef(entries);
    useEffect(() => {
        entriesRef.current = entries;
    });

    const updateEntry = useCallback(
        (index: number, patch: Partial<JobEntry>) => {
            setEntries((prev) =>
                prev.map((e, i) => (i === index ? { ...e, ...patch } : e)),
            );
        },
        [],
    );

    const initEntries = useCallback(
        (
            files: File[],
            getTargetExtension?: (file: File, index: number) => string,
        ) => {
            setEntries(
                files.map((f, index) => ({
                    file: f,
                    job: null,
                    localUrl: null,
                    downloadUrl: null,
                    targetExtension: getTargetExtension?.(f, index) ?? null,
                    error: null,
                })),
            );
        },
        [],
    );

    const reset = useCallback(() => setEntries([]), []);

    // Poll in-progress remote jobs every 2.5 s. Stable key avoids re-creating the
    // interval on every entry update — only changes when in-progress job IDs change.
    const pollKey = entries
        .filter(
            (e) =>
                e.job &&
                !['completed', 'failed', 'cancelled'].includes(e.job.status),
        )
        .map((e) => e.job!.id)
        .join(',');

    useEffect(() => {
        if (!pollKey) return;
        const id = window.setInterval(() => {
            entriesRef.current.forEach((entry, index) => {
                if (
                    !entry.job ||
                    ['completed', 'failed', 'cancelled'].includes(
                        entry.job.status,
                    )
                )
                    return;
                void getConversionJob(entry.job.id)
                    .then((job) => updateEntry(index, { job }))
                    .catch((err: unknown) => {
                        updateEntry(index, {
                            error:
                                err instanceof Error
                                    ? err.message
                                    : 'Failed to poll status.',
                        });
                    });
            });
        }, 2500);
        return () => window.clearInterval(id);
    }, [pollKey, updateEntry]);

    // Fetch download URLs for newly completed jobs.
    const downloadKey = entries
        .filter(
            (e) => e.job?.status === 'completed' && !e.downloadUrl && !e.error,
        )
        .map((e) => e.job!.id)
        .join(',');

    useEffect(() => {
        if (!downloadKey) return;
        entriesRef.current.forEach((entry, index) => {
            if (
                entry.job?.status !== 'completed' ||
                entry.downloadUrl ||
                entry.error
            )
                return;
            void getDownloadUrl(entry.job.id)
                .then((downloadUrl) => updateEntry(index, { downloadUrl }))
                .catch((err: unknown) => {
                    updateEntry(index, {
                        error:
                            err instanceof Error
                                ? err.message
                                : 'Failed to create download URL.',
                    });
                });
        });
    }, [downloadKey, updateEntry]);

    return { entries, initEntries, updateEntry, reset };
}
