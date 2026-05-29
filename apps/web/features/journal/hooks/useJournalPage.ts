import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { useJournalEditor } from '@/features/journal/hooks/useJournalEditor';
import { useAutosave } from '@/features/journal/hooks/useAutosave';
import { useJournalManager } from '@/features/journal/hooks/useJournalManager';
import { z } from 'zod';

const draftSchema = z.object({
    title: z.string(),
    content: z.string(),
});

export function useJournalPage() {
    const { user } = useAuth();
    const [focusMode, setFocusMode] = useState(false);

    const entryUtils = useJournalEntries(user?.id);
    const editorUtils = useJournalEditor();

    const { autosaved, restoreDraft, clearDraft } = useAutosave(
        editorUtils.editor,
        editorUtils.title,
        !editorUtils.isEditing,
    );

    const manager = useJournalManager(
        user,
        editorUtils.editor,
        editorUtils,
        entryUtils,
        clearDraft,
    );

    useEffect(() => {
        if (!editorUtils.isEditing && editorUtils.editor) {
            const draft = restoreDraft();
            const parsed = draftSchema.safeParse(draft);
            if (parsed.success) {
                if (parsed.data.title) editorUtils.setTitle(parsed.data.title);
                editorUtils.editor.commands.setContent(parsed.data.content);
                // setContent dispatches a ProseMirror transaction that can claim focus;
                // blur immediately so the title input stays usable on page load.
                editorUtils.editor.commands.blur();
            }
        }
    }, [editorUtils.editor, restoreDraft, editorUtils]);

    const wordCount = useMemo(
        () => editorUtils.editor?.storage.characterCount.words() ?? 0,
        [editorUtils.editor],
    );

    return {
        user,
        focusMode,
        setFocusMode,
        entryUtils,
        editorUtils,
        autosaved,
        wordCount,
        ...manager,
    };
}
