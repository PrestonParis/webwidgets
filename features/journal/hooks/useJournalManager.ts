import { useState, useCallback, useMemo } from 'react';
import { journalService } from '../api/journalService';
import { JournalEntry } from '@/features/journal/types/journal';
import { Editor } from '@tiptap/react';
import { useJournalEditor } from './useJournalEditor';
import { useJournalEntries } from './useJournalEntries';

export function useJournalManager(
    user: { id: string } | null,
    editor: Editor | null,
    editorUtils: ReturnType<typeof useJournalEditor>,
    entryUtils: ReturnType<typeof useJournalEntries>,
    clearDraft: () => void,
) {
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = useCallback(
        async (e: React.SyntheticEvent) => {
            e.preventDefault();
            if (!user?.id || !editor || !editorUtils.isValid()) return;

            setIsSaving(true);
            const content = editorUtils.getContent();

            const { error } = editorUtils.isEditing
                ? await journalService.updateEntry(
                      user.id,
                      String(editorUtils.editingId!),
                      editorUtils.title,
                      content,
                  )
                : await journalService.createEntry(
                      user.id,
                      editorUtils.title,
                      content,
                  );

            if (error) {
                console.error('Journal Action Error:', error);
            } else {
                clearDraft();
                editorUtils.resetForm();
                entryUtils.refreshEntries();
            }
            setIsSaving(false);
        },
        [user, editor, editorUtils, entryUtils, clearDraft],
    );

    const filteredEntries = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return entryUtils.entries.filter(
            (e: JournalEntry) =>
                e.title.toLowerCase().includes(q) ||
                e.content
                    .replace(/<[^>]+>/g, '')
                    .toLowerCase()
                    .includes(q),
        );
    }, [entryUtils.entries, searchQuery]);

    return {
        isSaving,
        searchQuery,
        setSearchQuery,
        handleSubmit,
        filteredEntries,
    };
}
