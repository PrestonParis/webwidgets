'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types';

interface RichEditorStateOptions {
    entry: JournalEntry | null;
    noteType: NoteType;
    onSave: (title: string, content: string) => Promise<void>;
}

export function useRichEditorState({
    entry,
    noteType,
    onSave,
}: RichEditorStateOptions) {
    const [title, setTitle] = useState(() => entry?.title ?? '');
    const [autosaved, setAutosaved] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const editor = useConfiguredEditor(entry, noteType);

    useEffect(() => {
        if (!entry) titleRef.current?.focus();
    }, [entry]);

    useEffect(() => {
        if (!editor) return;
        const handler = () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
            autosaveTimer.current = setTimeout(() => {
                void saveEditorContent(editor, title, onSave, setAutosaved);
            }, 2000);
        };
        editor.on('update', handler);
        return () => {
            editor.off('update', handler);
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [editor, title, onSave]);

    return { autosaved, editor, setTitle, title, titleRef };
}

function useConfiguredEditor(entry: JournalEntry | null, noteType: NoteType) {
    return useEditor({
        immediatelyRender: false,
        autofocus: false,
        content: entry?.content ?? '',
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder:
                    noteType === 'journal'
                        ? "What's on your mind today…"
                        : noteType === 'note'
                          ? 'Capture a note…'
                          : 'Start writing…',
            }),
            CharacterCount,
        ],
        editorProps: {
            attributes: {
                class: 'te-editor min-h-[400px] outline-none text-[15px] text-stone-800 dark:text-zinc-200 leading-relaxed',
            },
        },
    });
}

export async function saveEditorContent(
    editor: Editor,
    title: string,
    onSave: RichEditorStateOptions['onSave'],
    setAutosaved?: (saved: boolean) => void,
): Promise<void> {
    const content = editor.getHTML();
    if (!title.trim() && content === '<p></p>') return;
    await onSave(title || 'Untitled', content);
    setAutosaved?.(true);
    if (setAutosaved) setTimeout(() => setAutosaved(false), 2000);
}
