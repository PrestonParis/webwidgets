'use client';

import { EditorContent } from '@tiptap/react';
import { Toolbar } from '@/features/texteditor/components/Toolbar';
import {
    saveEditorContent,
    useRichEditorState,
} from '@/features/texteditor/hooks/useRichEditorState';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types';

interface RichEditorProps {
    entry: JournalEntry | null;
    noteType: NoteType;
    isSaving: boolean;
    onSave: (title: string, content: string) => Promise<void>;
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

    return (
        <div className="flex flex-col h-full">
            <EditorTitle
                noteType={props.noteType}
                title={title}
                titleRef={titleRef}
                onChange={setTitle}
            />
            <div className="px-10 py-2 flex items-center gap-3 border-b border-stone-100 dark:border-zinc-800/60">
                <Toolbar editor={editor} />
            </div>
            <div className="flex-1 overflow-y-auto px-10 py-6">
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
