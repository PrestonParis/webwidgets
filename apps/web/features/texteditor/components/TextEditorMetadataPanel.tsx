'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Info, Save } from 'lucide-react';
import type { JournalEntry } from '@/features/journal/types/journal';
import {
    mergeTextEditorMetadata,
    metadataTagsToText,
    metadataTextToTags,
    parseTextEditorDisplayDate,
    parseTextEditorMetadata,
} from '@/features/texteditor/lib/entryMetadata';

type TextEditorMetadataPanelProps = {
    entry: JournalEntry | null;
    saving: boolean;
    onSave: (metadata: Record<string, unknown>) => Promise<void>;
};

export function TextEditorMetadataPanel({
    entry,
    saving,
    onSave,
}: TextEditorMetadataPanelProps) {
    const metadata = useMemo(
        () => parseTextEditorMetadata(entry?.metadata),
        [entry?.metadata],
    );
    const [author, setAuthor] = useState(metadata.author ?? '');
    const [subject, setSubject] = useState(metadata.subject ?? '');
    const [tags, setTags] = useState(metadataTagsToText(metadata.tags));
    const [displayDate, setDisplayDate] = useState(
        metadata.displayDate ?? entry?.created_at.slice(0, 10) ?? '',
    );

    useEffect(() => {
        setAuthor(metadata.author ?? '');
        setSubject(metadata.subject ?? '');
        setTags(metadataTagsToText(metadata.tags));
        setDisplayDate(
            metadata.displayDate ?? entry?.created_at.slice(0, 10) ?? '',
        );
    }, [entry?.created_at, metadata]);

    if (!entry) {
        return (
            <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-400 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-600">
                Save this document before editing metadata.
            </div>
        );
    }

    const actualDate = new Date(entry.created_at);
    const dateWasModified =
        Boolean(displayDate) && displayDate !== entry.created_at.slice(0, 10);

    const handleSave = async () => {
        await onSave(
            mergeTextEditorMetadata(entry, {
                author: author.trim() || undefined,
                subject: subject.trim() || undefined,
                tags: metadataTextToTags(tags),
                displayDate,
            }),
        );
    };

    return (
        <div className="grid gap-2 rounded-xl border border-stone-100 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-zinc-200">
                    <Info size={13} />
                    Metadata
                </div>
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                        void handleSave();
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded-lg bg-stone-900 px-2 text-[11px] font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    <Save size={12} />
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-[11px] font-medium text-stone-500 dark:text-zinc-500">
                    Author
                    <input
                        value={author}
                        onChange={(event) => setAuthor(event.target.value)}
                        className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-800 outline-none focus:border-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                </label>
                <label className="grid gap-1 text-[11px] font-medium text-stone-500 dark:text-zinc-500">
                    Subject
                    <input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-800 outline-none focus:border-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                </label>
                <label className="grid gap-1 text-[11px] font-medium text-stone-500 dark:text-zinc-500">
                    Display date
                    <input
                        type="date"
                        value={displayDate}
                        onChange={(event) => setDisplayDate(event.target.value)}
                        className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-800 outline-none focus:border-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                </label>
                <label className="grid gap-1 text-[11px] font-medium text-stone-500 dark:text-zinc-500">
                    Tags
                    <input
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        placeholder="comma, separated"
                        className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-800 outline-none focus:border-stone-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    />
                </label>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-stone-400 dark:text-zinc-600">
                <CalendarDays size={12} className="mt-0.5 shrink-0" />
                <span>
                    Created internally{' '}
                    {actualDate.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                    {dateWasModified && displayDate
                        ? `; shown as ${parseTextEditorDisplayDate(displayDate).toLocaleDateString()}.`
                        : '.'}
                </span>
            </div>
        </div>
    );
}
