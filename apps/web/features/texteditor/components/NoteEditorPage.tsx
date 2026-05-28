'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { journalService } from '@/features/journal/api/journalService';
import { EntryList } from '@/features/texteditor/components/EntryList';
import { RichEditor } from '@/features/texteditor/components/RichEditor';
import {
    getLastActiveEntryId,
    setLastActiveEntryId,
} from '@/features/texteditor/hooks/useWidgetEditor';
import type { JournalEntry } from '@/features/journal/types/journal';
import type { NoteType } from '@/features/texteditor/types';

export function NoteEditorPage({ noteType }: { noteType: NoteType }) {
    const { user } = useAuth();
    const entryUtils = useJournalEntries(user?.id, noteType);
    const [activeEntry, setActiveEntryState] = useState<JournalEntry | null>(
        null,
    );
    const [isSaving, setIsSaving] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        initialized.current = false;
        const timeoutId = window.setTimeout(() => {
            setActiveEntryState(null);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [noteType]);

    // Restore the last-active entry the first time the list loads
    useEffect(() => {
        if (initialized.current || entryUtils.entries.length === 0) return;
        initialized.current = true;
        const lastId = getLastActiveEntryId(noteType);
        const found =
            lastId !== null
                ? (entryUtils.entries.find(
                      (e) => e.id === lastId && e.type === noteType,
                  ) ?? null)
                : null;
        setActiveEntryState(
            found ??
                entryUtils.entries.find((e) => e.type === noteType) ??
                null,
        );
    }, [entryUtils.entries, noteType]);

    const setActiveEntry = useCallback(
        (entry: JournalEntry | null) => {
            setActiveEntryState(entry);
            if (entry) setLastActiveEntryId(noteType, entry.id);
        },
        [noteType],
    );

    const handleSave = useCallback(
        async (title: string, content: string) => {
            if (!user?.id) return;
            setIsSaving(true);
            try {
                if (activeEntry) {
                    await journalService.updateEntry(
                        user.id,
                        String(activeEntry.id),
                        title,
                        content,
                    );
                    setLastActiveEntryId(noteType, activeEntry.id);
                } else {
                    const { data: newRow } = await journalService.createEntry(
                        user.id,
                        title,
                        content,
                        noteType,
                    );
                    if (newRow)
                        setActiveEntry(newRow as unknown as JournalEntry);
                }
                entryUtils.refreshEntries();
            } finally {
                setIsSaving(false);
            }
        },
        [user, activeEntry, noteType, entryUtils, setActiveEntry],
    );

    const handleNew = useCallback(() => setActiveEntry(null), [setActiveEntry]);

    const handleDelete = useCallback(
        async (id: number) => {
            await entryUtils.handleDelete(id);
            if (activeEntry?.id === id) setActiveEntryState(null);
        },
        [entryUtils, activeEntry],
    );

    return (
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-56 shrink-0 border-r border-stone-100 dark:border-zinc-800/60 flex flex-col overflow-hidden bg-stone-50/60 dark:bg-zinc-950/60">
                <EntryList
                    entries={entryUtils.entries}
                    activeId={activeEntry?.id ?? null}
                    onSelect={setActiveEntry}
                    onNew={handleNew}
                    noteType={noteType}
                    onDelete={(id) => {
                        void handleDelete(id);
                    }}
                    view={entryUtils.view}
                    onViewChange={entryUtils.setView}
                />
            </aside>
            <main className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
                <RichEditor
                    entry={activeEntry}
                    noteType={noteType}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onNew={handleNew}
                />
            </main>
        </div>
    );
}
