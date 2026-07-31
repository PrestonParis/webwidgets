'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
    FilePlus,
    PanelTopClose,
    PanelTop,
    LayoutTemplate,
} from 'lucide-react';
import { Toolbar } from './Toolbar';
import { useWidgetEditor } from '@/features/texteditor/hooks/useWidgetEditor';
import { TE_STYLES } from '@/features/texteditor/constants';
import type { NoteType } from '@/features/texteditor/types/texteditor';

const TEMPLATES: Array<{ label: string; title: string; content: string }> = [
    {
        label: 'Grocery List',
        title: 'Grocery List',
        content: `<h2>Grocery List</h2><ul><li>Produce</li><li>Dairy</li><li>Bread</li><li>Meat</li><li>Pantry</li></ul>`,
    },
    {
        label: 'Resume',
        title: 'Resume',
        content: `<h1>Full Name</h1><p>email@example.com · City, State · (555) 000-0000</p><h2>Summary</h2><p>Brief professional summary highlighting key skills and experience.</p><h2>Experience</h2><h3>Job Title at Company Name</h3><p><em>Month Year – Month Year</em></p><ul><li>Key accomplishment or responsibility</li><li>Key accomplishment or responsibility</li></ul><h2>Education</h2><h3>Degree from Institution</h3><p><em>Year</em></p><h2>Skills</h2><p>Skill A · Skill B · Skill C</p>`,
    },
    {
        label: 'Meeting Notes',
        title: 'Meeting Notes',
        content: `<h2>Meeting Notes</h2><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h3>Agenda</h3><ul><li></li></ul><h3>Discussion</h3><p></p><h3>Action Items</h3><ul><li>: Owner: </li></ul>`,
    },
    {
        label: 'Weekly Plan',
        title: 'Weekly Plan',
        content: `<h2>Weekly Plan</h2><h3>Monday</h3><ul><li></li></ul><h3>Tuesday</h3><ul><li></li></ul><h3>Wednesday</h3><ul><li></li></ul><h3>Thursday</h3><ul><li></li></ul><h3>Friday</h3><ul><li></li></ul>`,
    },
    {
        label: 'Project Brief',
        title: 'Project Brief',
        content: `<h2>Project Brief</h2><h3>Overview</h3><p></p><h3>Goals</h3><ul><li></li></ul><h3>Timeline</h3><p><strong>Start:</strong> &nbsp; <strong>End:</strong> </p><h3>Stakeholders</h3><p></p><h3>Notes</h3><p></p>`,
    },
];

const AUTOSAVE_MS = 1500;

export function WidgetNoteEditor({ noteType }: { noteType: NoteType }) {
    const { activeEntry, handleSave, handleNew } = useWidgetEditor(noteType);

    const [showToolbar, setShowToolbar] = useState(true);
    const [autosaved, setAutosaved] = useState(false);

    // Title in both state (controlled input) and ref (available in async save closure)
    const [title, setTitle] = useState(activeEntry?.title ?? '');
    const titleRef = useRef(activeEntry?.title ?? '');

    // Memoized so TipTap v3's compareOptions sees stable references on every
    // render and skips the setOptions → view.setProps → view.updateState cycle
    // that fires on every keystroke when these are inline literals.
    const extensions = useMemo(
        () => [
            StarterKit,
            Placeholder.configure({ placeholder: 'Start writing…' }),
            CharacterCount,
        ],
        [],
    );
    const editorProps = useMemo(
        () => ({
            attributes: {
                class: 'te-editor outline-none text-[13px] text-stone-800 dark:text-zinc-200 leading-relaxed',
            },
        }),
        [],
    );

    // Stable TipTap instance — content updated imperatively when entry changes
    const editor = useEditor({
        immediatelyRender: false,
        autofocus: false,
        content: activeEntry?.content ?? '',
        extensions,
        editorProps,
    });
    const activeEntryRef = useRef(activeEntry);
    const activeEntryId = activeEntry?.id;

    useEffect(() => {
        activeEntryRef.current = activeEntry;
    }, [activeEntry]);

    // Sync title + content whenever the active entry ID changes (switching
    // entries or a new entry is first created).
    //
    // Triggering on activeEntry?.content alone (not ID) would fire on every
    // autosave update for the same entry, calling setContent with content
    // already in the editor — a ProseMirror transaction that silently steals
    // focus from the title input mid-typing. Separate guards keep title sync
    // from marking editor content synced before TipTap has mounted.
    const titleSyncedEntryIdRef = useRef<number | null | undefined>(undefined);
    const contentSyncedEntryIdRef = useRef<number | null | undefined>(
        undefined,
    );
    const hasSyncedTitleRef = useRef(false);
    const hasSyncedContentRef = useRef(false);

    useEffect(() => {
        const entry = activeEntryRef.current;
        if (
            !hasSyncedTitleRef.current ||
            activeEntryId !== titleSyncedEntryIdRef.current
        ) {
            titleSyncedEntryIdRef.current = activeEntryId;
            hasSyncedTitleRef.current = true;
            const t = entry?.title ?? '';
            setTitle(t);
            titleRef.current = t;
        }

        if (
            editor &&
            (!hasSyncedContentRef.current ||
                activeEntryId !== contentSyncedEntryIdRef.current)
        ) {
            contentSyncedEntryIdRef.current = activeEntryId;
            hasSyncedContentRef.current = true;
            const incoming = entry?.content ?? '';
            editor.commands.setContent(incoming);
            editor.commands.blur();
        }
    }, [editor, activeEntryId]);

    // Autosave — ref-based so the effect only depends on [editor].
    // Without this, doSave → handleSave → entryUtils (new object every render)
    // caused scheduleAutosave to change on every keystroke, making the effect
    // cleanup run (clearTimeout) and cancel pending saves while the user typed.
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    // Always points to the latest save logic without re-creating the effect.
    const doSaveRef = useRef<() => Promise<void>>(async () => {});
    useEffect(() => {
        doSaveRef.current = async () => {
            if (!editor) return;
            const content = editor.getHTML();
            const t = titleRef.current;
            if (!t.trim() && content === '<p></p>') return;
            await handleSave(t.trim() || 'Untitled', content);
            setAutosaved(true);
            setTimeout(() => setAutosaved(false), 2000);
        };
    }, [editor, handleSave]);

    // Created once — always invokes the latest doSaveRef.current.
    const scheduleAutosave = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
            () => void doSaveRef.current(),
            AUTOSAVE_MS,
        );
    }, []);

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
        titleSyncedEntryIdRef.current = undefined;
        contentSyncedEntryIdRef.current = undefined;
        hasSyncedTitleRef.current = true;
        hasSyncedContentRef.current = true;
        editor?.commands.clearContent();
    }, [editor, handleNew]);

    const [templateOpen, setTemplateOpen] = useState(false);
    const templateRef = useRef<HTMLDivElement>(null);

    const applyTemplate = useCallback(
        (tpl: (typeof TEMPLATES)[number]) => {
            setTemplateOpen(false);
            clearTimeout(timerRef.current);
            handleNew();
            const newTitle = tpl.title;
            setTitle(newTitle);
            titleRef.current = newTitle;
            titleSyncedEntryIdRef.current = undefined;
            contentSyncedEntryIdRef.current = undefined;
            hasSyncedTitleRef.current = true;
            hasSyncedContentRef.current = true;
            editor?.commands.setContent(tpl.content);
        },
        [editor, handleNew],
    );

    const wordCount = editor?.storage.characterCount.words() ?? 0;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: TE_STYLES }} />
            <div
                className="flex flex-col -mx-4 -mt-2 min-h-55 overflow-hidden"
                style={{ height: '100%' }}
            >
                {/* Title bar — title input left, actions right */}
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 border-b border-stone-100 dark:border-zinc-800/60 shrink-0 min-w-0">
                    <input
                        type="text"
                        placeholder="Note title…"
                        value={title}
                        onChange={handleTitleChange}
                        className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-stone-900 dark:text-zinc-50 placeholder:text-stone-300 dark:placeholder:text-zinc-700"
                    />
                    <span
                        className={`text-[10px] transition-opacity text-emerald-500 shrink-0 ${autosaved ? 'opacity-100' : 'opacity-0'}`}
                    >
                        Saved
                    </span>
                    {/* Template picker */}
                    <div ref={templateRef} className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setTemplateOpen((v) => !v)}
                            title="Insert template"
                            className="w-6 h-6 flex items-center justify-center rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <LayoutTemplate size={13} />
                        </button>
                        {templateOpen && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                                {TEMPLATES.map((tpl) => (
                                    <button
                                        key={tpl.label}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                        onClick={() => applyTemplate(tpl)}
                                    >
                                        {tpl.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* New note */}
                    <button
                        type="button"
                        onClick={startNewNote}
                        title="New note"
                        className="w-6 h-6 flex items-center justify-center rounded-md text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all shrink-0"
                    >
                        <FilePlus size={13} />
                    </button>
                </div>

                {/* Toolbar */}
                {showToolbar && (
                    <div className="px-3 pb-1.5 pt-1 shrink-0">
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
                    <div className="px-3 pb-1.5 pt-1 shrink-0">
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
