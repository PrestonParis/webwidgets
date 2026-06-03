'use client';

import { EditorContent } from '@tiptap/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { TextEditorMetadataPanel } from '@/features/texteditor/components/TextEditorMetadataPanel';
import { Toolbar } from '@/features/texteditor/components/Toolbar';
import {
    saveEditorContent,
    useRichEditorState,
} from '@/features/texteditor/hooks/useRichEditorState';
import {
    downloadTextEditorDocument,
    textEditorDownloadFormats,
    type TextEditorDownloadFormat,
} from '@/features/texteditor/lib/downloadTextEditor';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types/texteditor';

interface RichEditorProps {
    entry: JournalEntry | null;
    noteType: NoteType;
    isSaving: boolean;
    onSave: (title: string, content: string) => Promise<void>;
    onMetadataSave: (metadata: Record<string, unknown>) => Promise<void>;
    onNew: () => void;
}

interface EditorStatusBarProps {
    autosaved: boolean;
    entry: JournalEntry | null;
    isSaving: boolean;
    noteType: NoteType;
    wordCount: number;
    onNew: () => void;
    onSave: () => void;
}

export function RichEditor(props: RichEditorProps) {
    const editorKey = props.entry?.id ?? `new-${props.noteType}`;
    return <RichEditorContent key={editorKey} {...props} />;
}

function EditorTitle({
    noteType,
    title,
    titleRef,
    onChange,
}: {
    noteType: NoteType;
    title: string;
    titleRef: React.RefObject<HTMLInputElement | null>;
    onChange: (title: string) => void;
}) {
    return (
        <div className="px-10 pt-10 pb-2">
            <input
                ref={titleRef}
                type="text"
                placeholder={
                    noteType === 'journal'
                        ? 'Entry title…'
                        : noteType === 'note'
                          ? 'Note title…'
                          : 'Document title…'
                }
                value={title}
                onChange={(e) => onChange(e.target.value)}
                className="w-full text-2xl font-semibold tracking-tight bg-transparent outline-none text-stone-900 dark:text-zinc-50 placeholder:text-stone-300 dark:placeholder:text-zinc-700"
            />
        </div>
    );
}

function EditorStatusBar(props: EditorStatusBarProps) {
    return (
        <div className="px-10 py-3 border-t border-stone-100 dark:border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] text-stone-400 dark:text-zinc-600">
                {props.wordCount} {props.wordCount === 1 ? 'word' : 'words'}
            </span>
            <div className="flex items-center gap-3">
                <span
                    className={`text-[11px] transition-opacity duration-300 text-emerald-500 ${props.autosaved ? 'opacity-100' : 'opacity-0'}`}
                >
                    Saved
                </span>
                <button
                    type="button"
                    onClick={props.onSave}
                    disabled={props.isSaving}
                    className="text-[11px] font-medium px-3 py-1 rounded-lg bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-stone-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-all"
                >
                    {props.isSaving
                        ? 'Saving…'
                        : props.entry
                          ? 'Update'
                          : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={props.onNew}
                    className="text-[11px] font-medium text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                >
                    + New{' '}
                    {props.noteType === 'journal'
                        ? 'Entry'
                        : props.noteType === 'note'
                          ? 'Note'
                          : 'Document'}
                </button>
            </div>
        </div>
    );
}

function RichEditorContent(props: RichEditorProps) {
    const { autosaved, editor, setTitle, title, titleRef } =
        useRichEditorState(props);
    const wordCount = editor?.storage.characterCount.words() ?? 0;
    const [downloadFormat, setDownloadFormat] =
        useState<TextEditorDownloadFormat>('docx');
    const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSavingMetadata, setIsSavingMetadata] = useState(false);

    const handleDownload = async () => {
        if (!editor) return;
        setIsDownloading(true);
        setDownloadStatus(null);
        try {
            await downloadTextEditorDocument({
                format: downloadFormat,
                html: editor.getHTML(),
                title: title || 'Untitled',
            });
            setDownloadStatus(`Downloaded ${downloadFormat.toUpperCase()}.`);
        } catch (error) {
            setDownloadStatus(
                error instanceof Error
                    ? error.message
                    : 'Could not export this document.',
            );
        } finally {
            setIsDownloading(false);
        }
    };

    const handleMetadataSave = async (metadata: Record<string, unknown>) => {
        setIsSavingMetadata(true);
        try {
            await props.onMetadataSave(metadata);
            setDownloadStatus('Metadata saved.');
        } finally {
            setIsSavingMetadata(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <EditorTitle
                noteType={props.noteType}
                title={title}
                titleRef={titleRef}
                onChange={setTitle}
            />
            <div className="px-10 py-2 flex items-center gap-3 border-b border-stone-100 dark:border-zinc-800/60">
                <Toolbar
                    editor={editor}
                    trailingSlot={
                        <div className="flex items-center gap-2">
                            {downloadStatus && (
                                <span className="max-w-64 truncate text-[11px] text-stone-400 dark:text-zinc-500">
                                    {downloadStatus}
                                </span>
                            )}
                            <label className="sr-only" htmlFor="download-as">
                                Download as
                            </label>
                            <select
                                id="download-as"
                                value={downloadFormat}
                                onChange={(event) =>
                                    setDownloadFormat(
                                        event.target
                                            .value as TextEditorDownloadFormat,
                                    )
                                }
                                className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs font-medium text-stone-700 outline-none transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                            >
                                {textEditorDownloadFormats.map((format) => (
                                    <option
                                        key={format.value}
                                        value={format.value}
                                    >
                                        {format.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    void handleDownload();
                                }}
                                disabled={!editor || isDownloading}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                <Download size={13} />
                                {isDownloading ? 'Preparing…' : 'Download as'}
                            </button>
                        </div>
                    }
                />
            </div>
            <div className="flex-1 overflow-y-auto px-10 py-6">
                <div className="mb-5">
                    <TextEditorMetadataPanel
                        entry={props.entry}
                        saving={isSavingMetadata}
                        onSave={handleMetadataSave}
                    />
                </div>
                <EditorContent editor={editor} />
            </div>
            <EditorStatusBar
                autosaved={autosaved}
                entry={props.entry}
                isSaving={props.isSaving}
                noteType={props.noteType}
                wordCount={wordCount}
                onNew={props.onNew}
                onSave={() => {
                    if (editor)
                        void saveEditorContent(editor, title, props.onSave);
                }}
            />
        </div>
    );
}
