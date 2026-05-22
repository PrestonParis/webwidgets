'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { FilePlus, PanelTopClose, PanelTop } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { useWidgetEditor } from '@/features/texteditor/hooks/useWidgetEditor';
import { TE_STYLES } from '@/features/texteditor/constants';
import type { NoteType } from '@/features/texteditor/types';

const AUTOSAVE_MS = 1500;

export function WidgetNoteEditor({ noteType }: { noteType: NoteType }) {
    const { activeEntry, handleSave, handleNew } = useWidgetEditor(noteType);

    const [showToolbar, setShowToolbar] = useState(true);
    const [autosaved, setAutosaved] = useState(false);

    // Title in both state (controlled input) and ref (available in async save closure)
    const [title, setTitle] = useState(activeEntry?.title ?? '');
    const titleRef = useRef(activeEntry?.title ?? '');

    // Track entry ID changes so we can sync title + content without remounting
    const prevEntryIdRef = useRef<number | null | undefined>(activeEntry?.id);

    useEffect(() => {
        if (activeEntry?.id === prevEntryIdRef.current) return;
        prevEntryIdRef.current = activeEntry?.id;
        const t = activeEntry?.title ?? '';
        setTitle(t);
        titleRef.current = t;
    }, [activeEntry?.id, activeEntry?.title]);

    // Stable TipTap instance — content updated imperatively when entry changes
    const editor = useEditor({
        immediatelyRender: false,
        autofocus: false,
        content: activeEntry?.content ?? '',
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Start writing…' }),
            CharacterCount,
        ],
        editorProps: {
            attributes: {
                class: 'te-editor outline-none text-[13px] text-stone-800 dark:text-zinc-200 leading-relaxed',
            },
        },
    });

    // Sync editor body when switching entries (imperative, no remount)
    const prevEntryContentRef = useRef(activeEntry?.content ?? '');
    useEffect(() => {
        if (!editor) return;
        const incoming = activeEntry?.content ?? '';
        if (incoming !== prevEntryContentRef.current) {
            prevEntryContentRef.current = incoming;
            editor.commands.setContent(incoming);
        }
    }, [activeEntry?.content, activeEntry?.id, editor]);

    // Autosave
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const doSave = useCallback(async () => {
        if (!editor) return;
        const content = editor.getHTML();
        const t = titleRef.current;
        if (!t.trim() && content === '<p></p>') return;
        await handleSave(t.trim() || 'Untitled', content);
        setAutosaved(true);
        setTimeout(() => setAutosaved(false), 2000);
    }, [editor, handleSave]);

    const scheduleAutosave = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => void doSave(), AUTOSAVE_MS);
    }, [doSave]);

    // Autosave on body changes
    useEffect(() => {
        if (!editor) return;
        editor.on('update', scheduleAutosave);
        return () => {
            editor.off('update', scheduleAutosave);
            clearTimeout(timerRef.current);
        };
    }, [editor, scheduleAutosave]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        titleRef.current = val;
        if (activeEntry) scheduleAutosave();
    };

    const startNewNote = useCallback(() => {
        clearTimeout(timerRef.current);
        handleNew();
        setTitle('');
        titleRef.current = '';
        prevEntryContentRef.current = '';
        editor?.commands.clearContent();
    }, [editor, handleNew]);

    const wordCount = editor?.storage.characterCount.words() ?? 0;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: TE_STYLES }} />
            <div
                className="flex flex-col -mx-4 -mt-2 min-h-[220px]"
                style={{ height: '100%' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-stone-100 dark:border-zinc-800/60 shrink-0">
                    <button
                        type="button"
                        onClick={startNewNote}
                        title="New note"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 transition-colors"
                    >
                        <FilePlus size={13} />
                        New Note
                    </button>
                    <span
                        className={`text-[10px] transition-opacity text-emerald-500 ${autosaved ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Saved
                    </span>
                </div>

                {/* Title */}
                <div className="px-3 pt-2.5 pb-1 shrink-0">
                    <input
                        type="text"
                        placeholder="Note title…"
                        value={title}
                        onChange={handleTitleChange}
                        className="w-full text-sm font-semibold bg-transparent outline-none text-stone-900 dark:text-zinc-50 placeholder:text-stone-300 dark:placeholder:text-zinc-700"
                    />
                </div>

                {/* Toolbar */}
                {showToolbar && (
                    <div className="px-3 pb-1.5 shrink-0">
                        <Toolbar
                            editor={editor}
                            compact
                            trailingSlot={
                                <button
                                    type="button"
                                    onClick={() => setShowToolbar(false)}
                                    title="Hide toolbar"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                                >
                                    <PanelTopClose size={13} />
                                </button>
                            }
                        />
                    </div>
                )}
                {!showToolbar && (
                    <div className="px-3 pb-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowToolbar(true)}
                            title="Show toolbar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <PanelTop size={13} />
                        </button>
                    </div>
                )}

                {/* Editor body */}
                <div className="flex-1 overflow-y-auto px-3 min-h-0">
                    <EditorContent editor={editor} />
                </div>

                {/* Footer: word count only */}
                <div className="px-3 py-1.5 border-t border-stone-100 dark:border-zinc-800/60 shrink-0">
                    <span className="text-[10px] text-stone-400 dark:text-zinc-600">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                </div>
            </div>
        </>
    );
}
