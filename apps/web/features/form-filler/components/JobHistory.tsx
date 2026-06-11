'use client';

import type { FormFillerJob, JobHistoryProps } from '../types/formFiller';

const STATUS_STYLES: Record<FormFillerJob['status'], string> = {
    pending: 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400',
    running: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
};

export function JobHistory({ jobs, loading }: JobHistoryProps) {
    if (loading) {
        return (
            <div className="text-sm text-stone-400 dark:text-zinc-500 py-6 text-center">
                Loading history…
            </div>
        );
    }
    if (jobs.length === 0) {
        return (
            <div className="text-sm text-stone-400 dark:text-zinc-500 py-6 text-center">
                No fill jobs yet. Enter a URL above and click Fill form.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {jobs.map((job) => (
                <div
                    key={job.id}
                    className="flex items-start gap-3 rounded-xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
                >
                    <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_STYLES[job.status]}`}
                    >
                        {job.status}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-stone-700 dark:text-zinc-300 truncate font-mono">
                            {job.url}
                        </p>
                        {job.fields_filled && (
                            <p className="text-[11px] text-stone-400 dark:text-zinc-500 mt-0.5">
                                {Object.keys(job.fields_filled).length} fields
                                filled
                            </p>
                        )}
                        {job.error && (
                            <p className="text-[11px] text-red-500 mt-0.5 truncate">
                                {job.error}
                            </p>
                        )}
                    </div>
                    <span className="text-[11px] text-stone-400 dark:text-zinc-600 shrink-0">
                        {new Date(job.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            ))}
        </div>
    );
}
