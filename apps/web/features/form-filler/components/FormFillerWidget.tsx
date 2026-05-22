'use client';

import { FormInput } from 'lucide-react';
import Link from 'next/link';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import {
    useFormFillerProfiles,
    useFormFillerJobs,
} from '@/features/form-filler/hooks/useFormFiller';

const STATUS_DOT: Record<string, string> = {
    pending: 'bg-stone-300 dark:bg-zinc-600',
    running: 'bg-blue-400 animate-pulse',
    done: 'bg-emerald-400',
    failed: 'bg-red-400',
};

export default function FormFillerWidget() {
    const { profiles, loading: profilesLoading } = useFormFillerProfiles();
    const { jobs, loading: jobsLoading } = useFormFillerJobs();

    const recentJobs = jobs.slice(0, 4);

    return (
        <WidgetShell
            icon={<FormInput size={16} />}
            title="Form Filler"
            widgetId="form-filler"
            widgetType="form-filler"
            footerHref="/form-filler"
            footerLabel="Open form filler"
        >
            {profilesLoading || jobsLoading ? (
                <div className="text-xs text-stone-400 dark:text-zinc-500 py-4 text-center">
                    Loading…
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Profile summary */}
                    <div className="text-xs text-stone-500 dark:text-zinc-400">
                        {profiles.length === 0 ? (
                            <Link
                                href="/form-filler"
                                className="text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                Set up a profile →
                            </Link>
                        ) : (
                            <span>
                                {profiles.length} profile
                                {profiles.length !== 1 ? 's' : ''} saved
                            </span>
                        )}
                    </div>

                    {/* Recent jobs */}
                    {recentJobs.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {recentJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status] ?? 'bg-stone-300'}`}
                                    />
                                    <span className="text-xs text-stone-600 dark:text-zinc-400 truncate flex-1 font-mono">
                                        {(() => {
                                            try {
                                                return new URL(job.url)
                                                    .hostname;
                                            } catch {
                                                return job.url;
                                            }
                                        })()}
                                    </span>
                                    <span className="text-[10px] text-stone-400 dark:text-zinc-600 shrink-0">
                                        {job.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-stone-400 dark:text-zinc-500">
                            No fills yet.
                        </p>
                    )}

                    {/* Quick action */}
                    <Link
                        href="/form-filler?tab=fill"
                        className="mt-1 text-center text-xs font-medium bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 py-1.5 rounded-lg transition-colors"
                    >
                        Fill a form →
                    </Link>
                </div>
            )}
        </WidgetShell>
    );
}
