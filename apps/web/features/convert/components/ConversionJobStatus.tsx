'use client';

import { CheckCircle2, CircleAlert, Loader2 } from 'lucide-react';
import type { ConversionJob } from '@/features/convert/types/conversion';

interface ConversionJobStatusProps {
    job: ConversionJob | null;
    downloadUrl: string | null;
    error: string | null;
}

export function ConversionJobStatus({
    job,
    downloadUrl,
    error,
}: ConversionJobStatusProps) {
    if (error) {
        return (
            <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                <CircleAlert className="h-4 w-4" />
                {error}
            </p>
        );
    }

    if (!job) return null;

    if (job.status === 'completed' && downloadUrl) {
        const baseName = job.originalFileName.replace(/\.[^.]+$/, '');
        const downloadName = `${baseName}.${job.targetExtension}`;
        return (
            <a
                href={downloadUrl}
                download={downloadName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Download result
            </a>
        );
    }

    if (job.status === 'failed') {
        return (
            <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                <CircleAlert className="h-4 w-4" />
                {job.errorMessage ?? 'Conversion failed.'}
            </p>
        );
    }

    return (
        <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Job {job.status}
        </p>
    );
}
