'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types/texteditor';

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
    const entryRef = useRef(entry);
    const entryId = entry?.id;

    useEffect(() => {
        entryRef.current = entry;
    }, [entry]);

    // Focus the title input when there is no active entry (new note).
    useEffect(() => {
        if (!entry) titleRef.current?.focus();
    }, [entry]);

    // Imperatively sync title and content when the active entry changes.
    // RichEditorContent is no longer re-keyed on entry.id, so we must update
    // TipTap via commands rather than relying on a full remount.
    const titleSyncedEntryIdRef = useRef<number | null | undefined>(undefined);
    const contentSyncedEntryIdRef = useRef<number | null | undefined>(
        undefined,
    );
    const hasSyncedTitleRef = useRef(false);
    const hasSyncedContentRef = useRef(false);

    useEffect(() => {
        const currentEntry = entryRef.current;
        if (
            !hasSyncedTitleRef.current ||
            entryId !== titleSyncedEntryIdRef.current
        ) {
            titleSyncedEntryIdRef.current = entryId;
            hasSyncedTitleRef.current = true;
            setTitle(currentEntry?.title ?? '');
        }

        if (
            editor &&
            (!hasSyncedContentRef.current ||
                entryId !== contentSyncedEntryIdRef.current)
        ) {
            contentSyncedEntryIdRef.current = entryId;
            hasSyncedContentRef.current = true;
            const incoming = currentEntry?.content ?? '';
            editor.commands.setContent(incoming);
            // setContent can steal focus; only keep editor focused if the entry
            // actually exists (switching entries), otherwise blur so the title
            // input remains usable when creating a new note.
            if (!currentEntry) {
                editor.commands.blur();
            }
        }
    }, [editor, entryId]);

    // Keep refs current so the autosave handler always reads the latest values
    // without needing to be re-registered on every title keystroke or onSave
    // identity change. Re-registering cancels the pending timer, silently
    // dropping autosaves that were triggered by editor body updates.
    const latestTitleRef = useRef(title);
    useEffect(() => {
        latestTitleRef.current = title;
    }, [title]);

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    useEffect(() => {
        if (!editor) return;
        const handler = () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
            autosaveTimer.current = setTimeout(() => {
                void saveEditorContent(
                    editor,
                    latestTitleRef.current,
                    onSaveRef.current,
                    setAutosaved,
                );
            }, 2000);
        };
        editor.on('update', handler);
        return () => {
            editor.off('update', handler);
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [editor]);

    return { autosaved, editor, setTitle, title, titleRef };
}

function useConfiguredEditor(entry: JournalEntry | null, noteType: NoteType) {
    // Memoized so TipTap v3's compareOptions sees stable references and skips
    // the setOptions → view.setProps → view.updateState cycle on every render.
    const extensions = useMemo(
        () => [
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
        [noteType],
    );
    const editorProps = useMemo(
        () => ({
            attributes: {
                class: 'te-editor min-h-[400px] outline-none text-[15px] text-stone-800 dark:text-zinc-200 leading-relaxed',
            },
        }),
        [],
    );

    return useEditor({
        immediatelyRender: false,
        autofocus: false,
        content: entry?.content ?? '',
        extensions,
        editorProps,
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
