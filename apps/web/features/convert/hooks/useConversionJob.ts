'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    getConversionJob,
    getDownloadUrl,
    startConversionJob,
} from '@/features/convert/lib/conversionClient';
import type { ConversionJob } from '@/features/convert/types/conversion';

export function useConversionJob() {
    const [job, setJob] = useState<ConversionJob | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const start = useCallback(async (jobId: string) => {
        setError(null);
        const nextJob = await startConversionJob(jobId);
        setJob(nextJob);
    }, []);

    useEffect(() => {
        if (!job || ['completed', 'failed', 'cancelled'].includes(job.status)) {
            return;
        }

        const interval = window.setInterval(() => {
            void getConversionJob(job.id)
                .then(setJob)
                .catch((pollError: unknown) => {
                    setError(
                        pollError instanceof Error
                            ? pollError.message
                            : 'Failed to poll conversion status.',
                    );
                });
        }, 2500);

        return () => window.clearInterval(interval);
    }, [job]);

    useEffect(() => {
        if (job?.status !== 'completed' || downloadUrl) return;
        void getDownloadUrl(job.id)
            .then(setDownloadUrl)
            .catch((downloadError: unknown) => {
                setError(
                    downloadError instanceof Error
                        ? downloadError.message
                        : 'Failed to create download URL.',
                );
            });
    }, [downloadUrl, job]);

    return {
        job,
        setJob,
        downloadUrl,
        error,
        setError,
        start,
    };
}
