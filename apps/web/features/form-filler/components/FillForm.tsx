'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { LoadingSpinner } from '@/features/ui/loading';
import { useFillFormRunner } from '../hooks/useFillFormRunner';
import type {
    FormFillerJob,
    FillFormProps,
    FormFillerProfile,
} from '../types/formFiller';

interface FillFormFieldsProps {
    profiles: FormFillerProfile[];
    profileId: string;
    running: boolean;
    url: string;
    onProfileChange: (profileId: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onUrlChange: (url: string) => void;
}

function FillFormFields({
    profiles,
    profileId,
    running,
    url,
    onProfileChange,
    onSubmit,
    onUrlChange,
}: FillFormFieldsProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-xs text-stone-500 dark:text-zinc-400">
                    Page URL
                </label>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://your-site.com/contact"
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
                    onChange={(e) => onProfileChange(e.target.value)}
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
                        <LoadingSpinner size="sm" /> Running…
                    </>
                ) : (
                    <>
                        <Play size={15} /> Fill form
                    </>
                )}
            </button>
        </form>
    );
}

function FillResult({ result }: { result: FormFillerJob }) {
    const filledCount = result.fields_filled
        ? Object.keys(result.fields_filled).length
        : 0;

    return (
        <div
            className={`rounded-xl border p-4 flex flex-col gap-3 ${
                result.status === 'done'
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
            }`}
        >
            {result.status === 'done' ? (
                <FillSuccess result={result} filledCount={filledCount} />
            ) : (
                <p className="text-sm text-red-700 dark:text-red-400">
                    Failed: {result.error ?? 'Unknown error'}
                </p>
            )}
        </div>
    );
}

function FillSuccess({
    result,
    filledCount,
}: {
    result: FormFillerJob;
    filledCount: number;
}) {
    return (
        <>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Filled {filledCount} field{filledCount !== 1 ? 's' : ''}{' '}
                successfully
            </p>
            {result.fields_filled && (
                <ul className="text-xs text-stone-600 dark:text-zinc-400 space-y-0.5">
                    {Object.entries(result.fields_filled).map(([k, v]) => (
                        <li key={k}>
                            <span className="font-mono">{k}</span>: {v}
                        </li>
                    ))}
                </ul>
            )}
            {result.screenshot && (
                <Image
                    src={`data:image/png;base64,${result.screenshot}`}
                    alt="Form screenshot"
                    width={1200}
                    height={800}
                    unoptimized
                    className="rounded-lg border border-stone-200 dark:border-zinc-700 w-full h-auto mt-1"
                />
            )}
        </>
    );
}

export function FillForm(props: FillFormProps) {
    const {
        activeJobId,
        handleSubmit,
        profileId,
        result,
        running,
        setProfileId,
        setUrl,
        url,
    } = useFillFormRunner(props);

    return (
        <div className="flex flex-col gap-5">
            <FillFormFields
                profiles={props.profiles}
                profileId={profileId}
                running={running}
                url={url}
                onProfileChange={setProfileId}
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
                onUrlChange={setUrl}
            />

            {running && activeJobId && (
                <div className="text-center text-xs text-stone-400 dark:text-zinc-500 py-4">
                    Browser is filling the form in the background…
                </div>
            )}

            {result && <FillResult result={result} />}
        </div>
    );
}
