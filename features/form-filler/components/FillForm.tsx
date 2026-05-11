'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Loader2 } from 'lucide-react';
import type { FormFillerJob, FillFormProps } from '../types';

export function FillForm({ profiles, onStartFill, onPollJob }: FillFormProps) {
    const [url, setUrl] = useState('');
    const [profileId, setProfileId] = useState('');
    const [running, setRunning] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [result, setResult] = useState<FormFillerJob | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Default to first profile
    useEffect(() => {
        if (!profileId && profiles.length > 0) {
            const id = setTimeout(() => setProfileId(profiles[0]?.id ?? ''), 0);
            return () => clearTimeout(id);
        }
    }, [profiles, profileId]);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !profileId || running) return;

        setRunning(true);
        setResult(null);
        const jobId = await onStartFill(url.trim(), profileId);
        if (!jobId) {
            setRunning(false);
            return;
        }

        setActiveJobId(jobId);

        pollRef.current = setInterval(() => {
            void (async () => {
                const job = await onPollJob(jobId);
                if (!job) return;
                if (job.status === 'done' || job.status === 'failed') {
                    stopPolling();
                    setResult(job);
                    setRunning(false);
                    setActiveJobId(null);
                }
            })();
        }, 1500);
    };

    // Cleanup on unmount
    useEffect(
        () => () => {
            stopPolling();
        },
        [],
    );

    const filledCount = result?.fields_filled
        ? Object.keys(result.fields_filled).length
        : 0;

    return (
        <div className="flex flex-col gap-5">
            <form
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-stone-500 dark:text-zinc-400">
                        Page URL
                    </label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/contact"
                        required
                        className="text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-stone-500 dark:text-zinc-400">
                        Profile to use
                    </label>
                    <select
                        value={profileId}
                        onChange={(e) => setProfileId(e.target.value)}
                        className="text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition-colors"
                    >
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={running || !url.trim() || !profileId}
                    className="flex items-center justify-center gap-2 bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-700 dark:hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                    {running ? (
                        <>
                            <Loader2 size={15} className="animate-spin" />{' '}
                            Running…
                        </>
                    ) : (
                        <>
                            <Play size={15} /> Fill form
                        </>
                    )}
                </button>
            </form>

            {/* Status during fill */}
            {running && activeJobId && (
                <div className="text-center text-xs text-stone-400 dark:text-zinc-500 py-4">
                    Browser is filling the form in the background…
                </div>
            )}

            {/* Result */}
            {result && (
                <div
                    className={`rounded-xl border p-4 flex flex-col gap-3 ${
                        result.status === 'done'
                            ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20'
                            : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
                    }`}
                >
                    {result.status === 'done' ? (
                        <>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Filled {filledCount} field
                                {filledCount !== 1 ? 's' : ''} successfully
                            </p>
                            {result.fields_filled && (
                                <ul className="text-xs text-stone-600 dark:text-zinc-400 space-y-0.5">
                                    {Object.entries(result.fields_filled).map(
                                        ([k, v]) => (
                                            <li key={k}>
                                                <span className="font-mono">
                                                    {k}
                                                </span>
                                                : {v}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                            {result.screenshot && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={`data:image/png;base64,${result.screenshot}`}
                                    alt="Form screenshot"
                                    className="rounded-lg border border-stone-200 dark:border-zinc-700 w-full mt-1"
                                />
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-red-700 dark:text-red-400">
                            Failed: {result.error ?? 'Unknown error'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
