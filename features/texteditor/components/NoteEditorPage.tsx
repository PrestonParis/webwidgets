'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { journalService } from '@/features/journal/api/journalService';
import { EntryList } from '@/features/texteditor/components/EntryList';
import { RichEditor } from '@/features/texteditor/components/RichEditor';
import type { JournalEntry } from '@/features/journal/types/journal';

export function NoteEditorPage({
    noteType,
}: {
    noteType: 'document' | 'journal';
}) {
    const { user } = useAuth();
    const entryUtils = useJournalEntries(user?.id, noteType);
    const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(
        async (title: string, content: string) => {
            if (!user?.id) return;
            setIsSaving(true);
            if (activeEntry) {
                await journalService.updateEntry(
                    user.id,
                    String(activeEntry.id),
                    title,
                    content,
                );
            } else {
                await journalService.createEntry(
                    user.id,
                    title,
                    content,
                    noteType,
                );
            }
            entryUtils.refreshEntries();
            setIsSaving(false);
        },
        [user, activeEntry, noteType, entryUtils],
    );

    const handleNew = useCallback(() => setActiveEntry(null), []);

    return (
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-56 shrink-0 border-r border-stone-100 dark:border-zinc-800/60 flex flex-col overflow-hidden bg-stone-50/60 dark:bg-zinc-950/60">
                <EntryList
                    entries={entryUtils.entries}
                    activeId={activeEntry?.id ?? null}
                    onSelect={setActiveEntry}
                    onNew={handleNew}
                    noteType={noteType}
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
